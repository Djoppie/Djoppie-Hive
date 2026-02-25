using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Infrastructure.Services;
using DjoppieHive.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace DjoppieHive.Tests.Services;

public class EmployeeServiceTests
{
    private readonly Mock<ILogger<EmployeeService>> _loggerMock;

    public EmployeeServiceTests()
    {
        _loggerMock = new Mock<ILogger<EmployeeService>>();
    }

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEmployees_WhenNoFilterApplied()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        result.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetAllAsync_FiltersActiveEmployees_WhenIsActiveFilterTrue()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var filter = new EmployeeFilter(IsActive: true);

        // Act
        var result = await service.GetAllAsync(filter);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(e => e.IsActive);
    }

    [Fact]
    public async Task GetAllAsync_FiltersInactiveEmployees_WhenIsActiveFilterFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var filter = new EmployeeFilter(IsActive: false);

        // Act
        var result = await service.GetAllAsync(filter);

        // Assert
        result.Should().HaveCount(1);
        result.Should().OnlyContain(e => !e.IsActive);
    }

    [Fact]
    public async Task GetAllAsync_FiltersByEmployeeType()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var filter = new EmployeeFilter(Type: EmployeeType.Vrijwilliger);

        // Act
        var result = await service.GetAllAsync(filter);

        // Assert
        result.Should().HaveCount(1);
        result.First().EmployeeType.Should().Be("Vrijwilliger");
    }

    [Fact]
    public async Task GetAllAsync_FiltersBySearchTerm()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var filter = new EmployeeFilter(SearchTerm: "jan");

        // Act
        var result = await service.GetAllAsync(filter);

        // Assert
        result.Should().HaveCount(1);
        result.First().DisplayName.Should().Contain("Jan");
    }

    [Fact]
    public async Task GetAllAsync_FiltersByDienst()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var dienstId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var filter = new EmployeeFilter(DienstId: dienstId);

        // Act
        var result = await service.GetAllAsync(filter);

        // Assert
        result.Should().HaveCount(1);
        result.First().DienstId.Should().Be(dienstId.ToString());
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ReturnsEmployee_WhenExists()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var employeeId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        // Act
        var result = await service.GetByIdAsync(employeeId);

        // Assert
        result.Should().NotBeNull();
        result!.DisplayName.Should().Be("Jan Janssen");
        result.Email.Should().Be("jan.janssen@diepenbeek.be");
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_CreatesEmployee_WithValidData()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var createDto = new CreateEmployeeDto(
            DisplayName: "Test Employee",
            GivenName: "Test",
            Surname: "Employee",
            Email: "test.employee@diepenbeek.be",
            JobTitle: "Test Job",
            Department: "Test Dept",
            OfficeLocation: null,
            MobilePhone: null,
            BusinessPhones: null,
            IsActive: true,
            EmployeeType: EmployeeType.Personeel,
            ArbeidsRegime: ArbeidsRegime.Voltijds,
            PhotoUrl: null,
            DienstId: null,
            StartDatum: DateTime.UtcNow,
            EindDatum: null,
            Telefoonnummer: "012345678",
            VrijwilligerDetails: null
        );

        // Act
        var result = await service.CreateAsync(createDto);

        // Assert
        result.Should().NotBeNull();
        result.DisplayName.Should().Be("Test Employee");
        result.Email.Should().Be("test.employee@diepenbeek.be");
        result.Bron.Should().Be("Handmatig");
        result.IsHandmatigToegevoegd.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAsync_ThrowsException_WhenEmailExists()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var createDto = new CreateEmployeeDto(
            DisplayName: "Duplicate Email",
            GivenName: "Duplicate",
            Surname: "Email",
            Email: "jan.janssen@diepenbeek.be", // Already exists
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

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(createDto));
    }

    [Fact]
    public async Task CreateAsync_ThrowsException_WhenDienstDoesNotExist()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var createDto = new CreateEmployeeDto(
            DisplayName: "Invalid Dienst",
            GivenName: "Invalid",
            Surname: "Dienst",
            Email: "invalid.dienst@diepenbeek.be",
            JobTitle: null,
            Department: null,
            OfficeLocation: null,
            MobilePhone: null,
            BusinessPhones: null,
            IsActive: true,
            EmployeeType: EmployeeType.Personeel,
            ArbeidsRegime: ArbeidsRegime.Voltijds,
            PhotoUrl: null,
            DienstId: Guid.NewGuid(), // Non-existent dienst
            StartDatum: null,
            EindDatum: null,
            Telefoonnummer: null,
            VrijwilligerDetails: null
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(createDto));
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_UpdatesEmployee_WhenManualSource()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var employeeId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"); // Manual employee
        var updateDto = new UpdateEmployeeDto(
            DisplayName: "Updated Name",
            GivenName: null,
            Surname: null,
            Email: null,
            JobTitle: "Updated Job",
            Department: null,
            OfficeLocation: null,
            MobilePhone: null,
            BusinessPhones: null,
            IsActive: null,
            EmployeeType: null,
            ArbeidsRegime: null,
            PhotoUrl: null,
            DienstId: null,
            StartDatum: null,
            EindDatum: null,
            Telefoonnummer: null,
            VrijwilligerDetails: null
        );

        // Act
        var result = await service.UpdateAsync(employeeId, updateDto);

        // Assert
        result.Should().NotBeNull();
        result!.DisplayName.Should().Be("Updated Name");
        result.JobTitle.Should().Be("Updated Job");
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNull_WhenEmployeeNotFound()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var updateDto = new UpdateEmployeeDto();

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updateDto);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_RestrictsFieldsForAzureSource()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var employeeId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"); // Azure employee
        var updateDto = new UpdateEmployeeDto(
            DisplayName: "Should Not Update", // Should be ignored for Azure source
            EmployeeType: EmployeeType.Interim, // Should update
            Telefoonnummer: "0498123456" // Should update
        );

        // Act
        var result = await service.UpdateAsync(employeeId, updateDto);

        // Assert
        result.Should().NotBeNull();
        result!.DisplayName.Should().Be("Jan Janssen"); // Original name preserved
        result.EmployeeType.Should().Be("Interim"); // Updated
        result.Telefoonnummer.Should().Be("0498123456"); // Updated
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_SoftDeletesEmployee_WhenExists()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);
        var employeeId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        // Act
        var result = await service.DeleteAsync(employeeId);

        // Assert
        result.Should().BeTrue();

        // Verify soft delete
        var employee = await service.GetByIdAsync(employeeId);
        employee.Should().NotBeNull();
        employee!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_WhenNotFound()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region GetVolunteersAsync Tests

    [Fact]
    public async Task GetVolunteersAsync_ReturnsOnlyActiveVolunteers()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);

        // Act
        var result = await service.GetVolunteersAsync();

        // Assert
        result.Should().HaveCount(1);
        result.Should().OnlyContain(e => e.EmployeeType == "Vrijwilliger" && e.IsActive);
    }

    #endregion

    #region SearchEmployeesAsync Tests

    [Fact]
    public async Task SearchEmployeesAsync_ReturnsMatchingEmployees()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);

        // Act
        var result = await service.SearchEmployeesAsync("janssen");

        // Assert
        result.Should().HaveCount(1);
        result.First().DisplayName.Should().Contain("Janssen");
    }

    [Fact]
    public async Task SearchEmployeesAsync_ReturnsEmpty_WhenQueryTooShort()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateWithTestData();
        var service = new EmployeeService(context, _loggerMock.Object);

        // Act
        var result = await service.SearchEmployeesAsync("j");

        // Assert
        result.Should().BeEmpty();
    }

    #endregion
}
