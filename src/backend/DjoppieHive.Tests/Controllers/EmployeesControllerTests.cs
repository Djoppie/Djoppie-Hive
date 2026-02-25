using DjoppieHive.API.Authorization;
using DjoppieHive.API.Controllers;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace DjoppieHive.Tests.Controllers;

public class EmployeesControllerTests
{
    private readonly Mock<IEmployeeService> _employeeServiceMock;
    private readonly Mock<IUserContextService> _userContextMock;
    private readonly Mock<ILogger<EmployeesController>> _loggerMock;
    private readonly EmployeesController _controller;

    public EmployeesControllerTests()
    {
        _employeeServiceMock = new Mock<IEmployeeService>();
        _userContextMock = new Mock<IUserContextService>();
        _loggerMock = new Mock<ILogger<EmployeesController>>();

        _controller = new EmployeesController(
            _employeeServiceMock.Object,
            _userContextMock.Object,
            _loggerMock.Object);

        // Setup HTTP context
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        // Default: user is admin
        _userContextMock.Setup(x => x.IsAdmin()).Returns(true);
    }

    #region GetAll Tests

    [Fact]
    public async Task GetAll_ReturnsOkWithEmployees_WhenAdminUser()
    {
        // Arrange
        var employees = new List<EmployeeDto>
        {
            CreateTestEmployeeDto("Jan Janssen"),
            CreateTestEmployeeDto("Piet Pietersen")
        };
        _employeeServiceMock
            .Setup(s => s.GetAllAsync(It.IsAny<EmployeeFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(employees);

        // Act
        var result = await _controller.GetAll();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedEmployees = okResult.Value.Should().BeAssignableTo<IEnumerable<EmployeeDto>>().Subject;
        returnedEmployees.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAll_FiltersBySector_WhenSectorManagerRole()
    {
        // Arrange
        var sectorId = Guid.NewGuid();
        _userContextMock.Setup(x => x.IsAdmin()).Returns(false);
        _userContextMock.Setup(x => x.HasRole(AppRoles.SectorManager)).Returns(true);
        _userContextMock.Setup(x => x.GetCurrentUserSectorIdAsync()).ReturnsAsync(sectorId);

        var employees = new List<EmployeeDto> { CreateTestEmployeeDto("Jan Janssen") };
        _employeeServiceMock
            .Setup(s => s.GetAllAsync(
                It.Is<EmployeeFilter>(f => f.SectorId == sectorId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(employees);

        // Act
        var result = await _controller.GetAll();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        _employeeServiceMock.Verify(s => s.GetAllAsync(
            It.Is<EmployeeFilter>(f => f.SectorId == sectorId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAll_FiltersByDienst_WhenDiensthoofdRole()
    {
        // Arrange
        var dienstId = Guid.NewGuid();
        _userContextMock.Setup(x => x.IsAdmin()).Returns(false);
        _userContextMock.Setup(x => x.HasRole(AppRoles.SectorManager)).Returns(false);
        _userContextMock.Setup(x => x.HasRole(AppRoles.Diensthoofd)).Returns(true);
        _userContextMock.Setup(x => x.GetCurrentUserDienstIdAsync()).ReturnsAsync(dienstId);

        var employees = new List<EmployeeDto> { CreateTestEmployeeDto("Jan Janssen") };
        _employeeServiceMock
            .Setup(s => s.GetAllAsync(
                It.Is<EmployeeFilter>(f => f.DienstId == dienstId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(employees);

        // Act
        var result = await _controller.GetAll();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        _employeeServiceMock.Verify(s => s.GetAllAsync(
            It.Is<EmployeeFilter>(f => f.DienstId == dienstId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAll_ReturnsOnlyOwnData_WhenMedewerkerRole()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        _userContextMock.Setup(x => x.IsAdmin()).Returns(false);
        _userContextMock.Setup(x => x.HasRole(AppRoles.SectorManager)).Returns(false);
        _userContextMock.Setup(x => x.HasRole(AppRoles.Diensthoofd)).Returns(false);
        _userContextMock.Setup(x => x.HasRole(AppRoles.Medewerker)).Returns(true);
        _userContextMock.Setup(x => x.GetCurrentEmployeeIdAsync()).ReturnsAsync(employeeId);

        var employee = CreateTestEmployeeDto("Jan Janssen");
        _employeeServiceMock
            .Setup(s => s.GetByIdAsync(employeeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(employee);

        // Act
        var result = await _controller.GetAll();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedEmployees = okResult.Value.Should().BeAssignableTo<IEnumerable<EmployeeDto>>().Subject;
        returnedEmployees.Should().HaveCount(1);
    }

    #endregion

    #region GetById Tests

    [Fact]
    public async Task GetById_ReturnsOk_WhenEmployeeExists()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var employee = CreateTestEmployeeDto("Jan Janssen");
        _employeeServiceMock
            .Setup(s => s.GetByIdAsync(employeeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(employee);

        // Act
        var result = await _controller.GetById(employeeId, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedEmployee = okResult.Value.Should().BeOfType<EmployeeDto>().Subject;
        returnedEmployee.DisplayName.Should().Be("Jan Janssen");
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenEmployeeDoesNotExist()
    {
        // Arrange
        _employeeServiceMock
            .Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((EmployeeDto?)null);

        // Act
        var result = await _controller.GetById(Guid.NewGuid(), CancellationToken.None);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Create Tests

    [Fact]
    public async Task Create_ReturnsCreatedAtAction_WhenSuccessful()
    {
        // Arrange
        var createDto = new CreateEmployeeDto(
            DisplayName: "New Employee",
            GivenName: "New",
            Surname: "Employee",
            Email: "new.employee@diepenbeek.be",
            JobTitle: null,
            Department: null,
            OfficeLocation: null,
            MobilePhone: null,
            BusinessPhones: null,
            IsActive: true,
            EmployeeType: EmployeeType.Personeel,
            ArbeidsRegime: ArbeidsRegime.Voltijds,
            PhotoUrl: null,
            DienstId: null,
            StartDatum: null,
            EindDatum: null,
            Telefoonnummer: null,
            VrijwilligerDetails: null
        );

        var createdEmployee = CreateTestEmployeeDto("New Employee");
        _employeeServiceMock
            .Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdEmployee);

        // Act
        var result = await _controller.Create(createDto, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be(nameof(EmployeesController.GetById));
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenInvalidOperationException()
    {
        // Arrange
        var createDto = new CreateEmployeeDto(
            DisplayName: "Duplicate",
            GivenName: "Duplicate",
            Surname: "Employee",
            Email: "existing@diepenbeek.be",
            JobTitle: null,
            Department: null,
            OfficeLocation: null,
            MobilePhone: null,
            BusinessPhones: null,
            IsActive: true,
            EmployeeType: EmployeeType.Personeel,
            ArbeidsRegime: ArbeidsRegime.Voltijds,
            PhotoUrl: null,
            DienstId: null,
            StartDatum: null,
            EindDatum: null,
            Telefoonnummer: null,
            VrijwilligerDetails: null
        );

        _employeeServiceMock
            .Setup(s => s.CreateAsync(createDto, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Email already exists"));

        // Act
        var result = await _controller.Create(createDto, CancellationToken.None);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    #endregion

    #region Update Tests

    [Fact]
    public async Task Update_ReturnsOk_WhenSuccessful()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var updateDto = new UpdateEmployeeDto(JobTitle: "Updated Job");
        var updatedEmployee = CreateTestEmployeeDto("Jan Janssen", "Updated Job");

        _employeeServiceMock
            .Setup(s => s.UpdateAsync(employeeId, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedEmployee);

        // Act
        var result = await _controller.Update(employeeId, updateDto, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var employee = okResult.Value.Should().BeOfType<EmployeeDto>().Subject;
        employee.JobTitle.Should().Be("Updated Job");
    }

    [Fact]
    public async Task Update_ReturnsNotFound_WhenEmployeeDoesNotExist()
    {
        // Arrange
        var updateDto = new UpdateEmployeeDto(JobTitle: "Updated");
        _employeeServiceMock
            .Setup(s => s.UpdateAsync(It.IsAny<Guid>(), updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((EmployeeDto?)null);

        // Act
        var result = await _controller.Update(Guid.NewGuid(), updateDto, CancellationToken.None);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Delete Tests

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenSuccessful()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        _employeeServiceMock
            .Setup(s => s.DeleteAsync(employeeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Delete(employeeId, CancellationToken.None);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenEmployeeDoesNotExist()
    {
        // Arrange
        _employeeServiceMock
            .Setup(s => s.DeleteAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.Delete(Guid.NewGuid(), CancellationToken.None);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Helper Methods

    private static EmployeeDto CreateTestEmployeeDto(string displayName, string? jobTitle = null)
    {
        return new EmployeeDto(
            Id: Guid.NewGuid().ToString(),
            DisplayName: displayName,
            GivenName: displayName.Split(' ').First(),
            Surname: displayName.Split(' ').Last(),
            Email: $"{displayName.ToLower().Replace(" ", ".")}@diepenbeek.be",
            JobTitle: jobTitle,
            Department: null,
            OfficeLocation: null,
            MobilePhone: null,
            Groups: new List<string>(),
            IsActive: true,
            Bron: "AzureAD",
            IsHandmatigToegevoegd: false,
            EmployeeType: "Personeel",
            ArbeidsRegime: "Voltijds",
            PhotoUrl: null,
            DienstId: null,
            DienstNaam: null,
            SectorNaam: null,
            StartDatum: null,
            EindDatum: null,
            Telefoonnummer: null,
            ValidatieStatus: "Goedgekeurd",
            GevalideerdDoor: null,
            ValidatieDatum: null,
            VrijwilligerDetails: null,
            CreatedAt: DateTime.UtcNow,
            UpdatedAt: null,
            LastSyncedAt: null
        );
    }

    #endregion
}
