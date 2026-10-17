using Microsoft.Extensions.DependencyInjection;
using Scrutor;

namespace BTN.Business;

public static class DependencyInjection
{
    public static IServiceCollection AddBusinessServices(this IServiceCollection services)
    {
        services.AddScoped<Authentication.ITokenGenerator, Authentication.TokenGenerator>();
        services.AddScoped<Org.IOrgScopeService, Org.OrgScopeService>();
        services.AddScoped<Routing.ILeadRoutingService, Routing.LeadRoutingService>();

        services.Scan(scan => scan
            .FromAssemblyOf<BusinessAssemblyMarker>()
            .AddClasses(c => c.Where(t => t.Name.EndsWith("Manager") && !t.Name.StartsWith("I")))
            .AsMatchingInterface()
            .WithScopedLifetime());

        return services;
    }
}
