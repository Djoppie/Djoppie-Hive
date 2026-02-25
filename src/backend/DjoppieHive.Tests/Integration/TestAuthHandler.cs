using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace DjoppieHive.Tests.Integration;

/// <summary>
/// Test authentication handler that simulates authenticated users for integration tests.
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly CustomWebApplicationFactory _factory;

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        CustomWebApplicationFactory factory)
        : base(options, logger, encoder)
    {
        _factory = factory;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check if we should simulate anonymous request
        if (Request.Headers.TryGetValue("X-Test-Anonymous", out _))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var claims = new List<Claim>();

        // Add user identity claims
        if (!string.IsNullOrEmpty(_factory.TestUserId))
        {
            claims.Add(new Claim("oid", _factory.TestUserId));
            claims.Add(new Claim(ClaimTypes.NameIdentifier, _factory.TestUserId));
        }

        if (!string.IsNullOrEmpty(_factory.TestUserEmail))
        {
            claims.Add(new Claim("preferred_username", _factory.TestUserEmail));
            claims.Add(new Claim(ClaimTypes.Email, _factory.TestUserEmail));
        }

        if (!string.IsNullOrEmpty(_factory.TestUserName))
        {
            claims.Add(new Claim("name", _factory.TestUserName));
            claims.Add(new Claim(ClaimTypes.Name, _factory.TestUserName));
        }

        // Add role claims
        foreach (var role in _factory.TestUserRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim("roles", role));
        }

        var identity = new ClaimsIdentity(claims, "TestScheme");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "TestScheme");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
