using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BTN.API.Middleware
{
    public class AuditLogMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuditLogMiddleware> _logger;

        public AuditLogMiddleware(RequestDelegate next, ILogger<AuditLogMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            await _next(context);

            var path = context.Request.Path.Value;
            var method = context.Request.Method;
            
            if (context.User.Identity?.IsAuthenticated == true && (method == "POST" || method == "PUT" || method == "DELETE"))
            {
                var userIdStr = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var email = context.User.FindFirst(ClaimTypes.Email)?.Value;
                _logger.LogInformation("Audit Log: User {Email} ({UserId}) executed {Method} on {Path} with status {StatusCode}", 
                    email, userIdStr, method, path, context.Response.StatusCode);
            }
        }
    }
}
