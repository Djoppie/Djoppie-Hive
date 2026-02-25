using Azure.Identity;
using DjoppieHive.API.Authorization;
using DjoppieHive.API.Middleware;
using DjoppieHive.API.Validators;
using DjoppieHive.Infrastructure;
using DjoppieHive.Infrastructure.Data;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph;
using Microsoft.Identity.Web;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// SECURITY: Rate Limiting (Task 2.1)
// ============================================
builder.Services.AddRateLimiter(options =>
{
    // Global rate limiter: 100 requests per minute per user (or IP for anonymous)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        // Use user ID if authenticated, otherwise use IP address
        var userId = httpContext.User?.Identity?.IsAuthenticated == true
            ? httpContext.User.FindFirst("oid")?.Value ?? httpContext.User.Identity.Name
            : null;

        var partitionKey = userId ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: partitionKey,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            });
    });

    // Specific limiter for sync operations (expensive operation)
    options.AddFixedWindowLimiter("sync", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(5);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 2;
    });

    // Specific limiter for authentication-related endpoints
    options.AddFixedWindowLimiter("auth", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0;
    });

    // Rate limit exceeded response
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";

        var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterValue)
            ? retryAfterValue.TotalSeconds
            : 60;

        context.HttpContext.Response.Headers.RetryAfter = retryAfter.ToString();

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Te veel verzoeken. Probeer het later opnieuw.",
            retryAfterSeconds = retryAfter
        }, cancellationToken);
    };
});

// ============================================
// SECURITY: Authentication (Entra ID)
// ============================================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// Add Graph client using client credentials flow (application permissions)
var tenantId = builder.Configuration["AzureAd:TenantId"];
var clientId = builder.Configuration["AzureAd:ClientId"];
var clientSecret = builder.Configuration["AzureAd:ClientSecret"];

if (!string.IsNullOrEmpty(tenantId) && !string.IsNullOrEmpty(clientId) && !string.IsNullOrEmpty(clientSecret))
{
    var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    var graphClient = new GraphServiceClient(credential, new[] { "https://graph.microsoft.com/.default" });
    builder.Services.AddSingleton(graphClient);
}
else
{
    Console.WriteLine("WARNING: Graph API credentials not configured. Distribution groups will not work.");
}

// ============================================
// SECURITY: Authorization with role-based policies
// ============================================
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContextService, UserContextService>();
builder.Services.AddDjoppieHiveAuthorization();

// ============================================
// SECURITY: Input Validation - FluentValidation (Task 2.2)
// ============================================
builder.Services.AddValidatorsFromAssemblyContaining<CreateEmployeeDtoValidator>();
builder.Services.AddFluentValidationAutoValidation();

// Add Infrastructure services (DbContext, Graph services)
builder.Services.AddInfrastructure(builder.Configuration);

// Add controllers with JSON options for enum string conversion
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Add Swagger/OpenAPI with full documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Djoppie-Hive API",
        Version = "v1",
        Description = @"
## HR Admin API voor Gemeente Diepenbeek

Dit is de backend API voor Djoppie-Hive, het HR personeelsbeheer systeem van Gemeente Diepenbeek.

### Belangrijke features:
- **Medewerkersbeheer**: CRUD operaties voor personeel, vrijwilligers en interims
- **Distributiegroepen**: Synchronisatie met Microsoft 365 MG- groepen
- **Organisatiehierarchie**: Sectoren en diensten structuur
- **Audit logging**: GDPR-compliant logging van alle wijzigingen
- **Role-based access**: Scoped toegang op basis van sector/dienst

### Authenticatie
Alle endpoints vereisen een geldig JWT token van Microsoft Entra ID.
Gebruik de **Authorize** knop om in te loggen met uw Bearer token.

### Rate Limiting
- Globaal: 100 requests per minuut
- Sync endpoints: 5 requests per 5 minuten
- Auth endpoints: 10 requests per minuut
",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "ICT Diepenbeek",
            Email = "ict@diepenbeek.be",
            Url = new Uri("https://www.diepenbeek.be")
        },
        License = new Microsoft.OpenApi.Models.OpenApiLicense
        {
            Name = "Proprietary - Gemeente Diepenbeek",
            Url = new Uri("https://www.diepenbeek.be")
        }
    });

    // Add JWT Bearer authentication to Swagger UI
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = @"JWT Authorization header met Bearer token van Microsoft Entra ID.

Verkrijg een token via MSAL met scope: `api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user`

Voorbeeld: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments from controllers
    var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    // Include XML comments from Core project (DTOs)
    var coreXmlPath = Path.Combine(AppContext.BaseDirectory, "DjoppieHive.Core.xml");
    if (File.Exists(coreXmlPath))
    {
        options.IncludeXmlComments(coreXmlPath);
    }

    // Custom ordering of tags
    options.TagActionsBy(api =>
    {
        if (api.GroupName != null)
        {
            return new[] { api.GroupName };
        }

        if (api.ActionDescriptor is Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor controllerActionDescriptor)
        {
            return new[] { controllerActionDescriptor.ControllerName };
        }

        throw new InvalidOperationException("Unable to determine tag for endpoint.");
    });

    options.DocInclusionPredicate((name, api) => true);
});

// ============================================
// SECURITY: CORS Hardening (Task 2.5)
// ============================================
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        // Development: Allow localhost ports
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://localhost:5175"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    }
    else
    {
        // Production: Strict origins only
        var allowedOrigins = builder.Configuration.GetSection("Security:AllowedOrigins")
            .Get<string[]>() ?? Array.Empty<string>();

        // Add configured frontend URL if present
        var frontendUrl = builder.Configuration.GetValue<string>("FrontendUrl");
        if (!string.IsNullOrEmpty(frontendUrl))
        {
            allowedOrigins = allowedOrigins.Append(frontendUrl).ToArray();
        }

        if (allowedOrigins.Length == 0)
        {
            Console.WriteLine("WARNING: No allowed CORS origins configured for production!");
        }

        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                .WithHeaders(
                    "Authorization",
                    "Content-Type",
                    "Accept",
                    "X-Requested-With"
                )
                .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .AllowCredentials()
                .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
        });
    }
});

// Add health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>();

var app = builder.Build();

// ============================================
// SECURITY: Security Headers Middleware (Task 2.6)
// ============================================
app.UseSecurityHeaders();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Djoppie-Hive API v1");
    });

    // Auto-migrate database in development
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();

    // Seed predefined dynamic groups for Hybrid Groups System
    var unifiedGroupService = scope.ServiceProvider.GetRequiredService<DjoppieHive.Core.Interfaces.IUnifiedGroupService>();
    await unifiedGroupService.SeedPredefinedDynamicGroupsAsync(CancellationToken.None);
}

// SECURITY: Force HTTPS in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// SECURITY: Rate Limiting
app.UseRateLimiter();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
