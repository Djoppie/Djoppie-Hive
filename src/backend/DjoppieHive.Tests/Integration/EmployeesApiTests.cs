using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;

namespace DjoppieHive.Tests.Integration;

/// <summary>
/// Integration tests for the Employees API endpoints.
/// Tests the full HTTP pipeline including routing, authentication, and authorization.
/// </summary>
public class EmployeesApiTests : IAsyncLifetime
{
    private CustomWebApplicationFactory _factory = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
        await SeedTestEmployeesAsync();
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        await _factory.DisposeAsync();
    }

    private async Task SeedTestEmployeesAsync()
    {
        await _factory.SeedDatabaseAsync(context =>
        {
            var employee1 = new Employee
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                EntraObjectId = "entra-id-1",
                DisplayName = "Jan Janssen",
                GivenName = "Jan",
                Surname = "Janssen",
                Email = "jan.janssen@diepenbeek.be",
                JobTitle = "Administratief Medewerker",
                EmployeeType = EmployeeType.Personeel,
                ArbeidsRegime = ArbeidsRegime.Voltijds,
                IsActive = true,
                Bron = GegevensBron.AzureAD,
                CreatedAt = DateTime.UtcNow
            };

            var employee2 = new Employee
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                EntraObjectId = "entra-id-2",
                DisplayName = "Piet Pietersen",
                GivenName = "Piet",
                Surname = "Pietersen",
                Email = "piet.pietersen@diepenbeek.be",
                JobTitle = "Teamcoach",
                EmployeeType = EmployeeType.Personeel,
                ArbeidsRegime = ArbeidsRegime.Voltijds,
                IsActive = true,
                Bron = GegevensBron.Handmatig,
                IsHandmatigToegevoegd = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Employees.AddRange(employee1, employee2);
        });
    }

    #region GET /api/employees Tests

    [Fact]
    public async Task GetAll_ReturnsOk_WhenAuthenticated()
    {
        // Arrange - default role is ict_super_admin

        // Act
        var response = await _client.GetAsync("/api/employees");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var employees = await response.Content.ReadFromJsonAsync<List<EmployeeDto>>();
        employees.Should().NotBeNull();
        employees.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAll_ReturnsUnauthorized_WhenNotAuthenticated()
    {
        // Arrange - set anonymous header
        _client.DefaultRequestHeaders.Add("X-Test-Anonymous", "true");

        // Act
        var response = await _client.GetAsync("/api/employees");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region GET /api/employees/{id} Tests

    [Fact]
    public async Task GetById_ReturnsEmployee_WhenExists()
    {
        // Arrange
        var employeeId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        // Act
        var response = await _client.GetAsync($"/api/employees/{employeeId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var employee = await response.Content.ReadFromJsonAsync<EmployeeDto>();
        employee.Should().NotBeNull();
        employee!.DisplayName.Should().Be("Jan Janssen");
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/employees/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region POST /api/employees Tests

    [Fact]
    public async Task Create_ReturnsCreated_WhenValidData()
    {
        // Arrange
        var createDto = new CreateEmployeeDto(
            DisplayName: "New Employee",
            GivenName: "New",
            Surname: "Employee",
            Email: "new.employee@diepenbeek.be",
            JobTitle: "Developer",
            Department: "IT",
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
            Telefoonnummer: null,
            VrijwilligerDetails: null
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/employees", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdEmployee = await response.Content.ReadFromJsonAsync<EmployeeDto>();
        createdEmployee.Should().NotBeNull();
        createdEmployee!.DisplayName.Should().Be("New Employee");
        createdEmployee.Bron.Should().Be("Handmatig");
    }

    [Fact]
    public async Task Create_ReturnsForbidden_WhenNotAdmin()
    {
        // Arrange - non-admin user (medewerker has no edit rights)
        _factory.TestUserRoles = new List<string> { "medewerker" };
        using var nonAdminClient = _factory.CreateClient();

        var createDto = new CreateEmployeeDto(
            DisplayName: "Test",
            GivenName: "Test",
            Surname: "Test",
            Email: "test@diepenbeek.be",
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

        // Act
        var response = await nonAdminClient.PostAsJsonAsync("/api/employees", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region PUT /api/employees/{id} Tests

    [Fact]
    public async Task Update_ReturnsOk_WhenSuccessful()
    {
        // Arrange - use manual employee which can be fully updated
        var employeeId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
        var updateDto = new UpdateEmployeeDto(
            DisplayName: "Updated Name",
            JobTitle: "Senior Teamcoach"
        );

        // Act
        var response = await _client.PutAsJsonAsync($"/api/employees/{employeeId}", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedEmployee = await response.Content.ReadFromJsonAsync<EmployeeDto>();
        updatedEmployee.Should().NotBeNull();
        updatedEmployee!.DisplayName.Should().Be("Updated Name");
        updatedEmployee.JobTitle.Should().Be("Senior Teamcoach");
    }

    [Fact]
    public async Task Update_ReturnsNotFound_WhenEmployeeDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();
        var updateDto = new UpdateEmployeeDto(JobTitle: "Test");

        // Act
        var response = await _client.PutAsJsonAsync($"/api/employees/{nonExistentId}", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region DELETE /api/employees/{id} Tests

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenSuccessful()
    {
        // Arrange
        var employeeId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        // Act
        var response = await _client.DeleteAsync($"/api/employees/{employeeId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenEmployeeDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/employees/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion
}
