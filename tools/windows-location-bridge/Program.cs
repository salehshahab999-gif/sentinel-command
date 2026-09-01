using System.Text.Json;
using Windows.Devices.Geolocation;

namespace Sentinel.WindowsLocationBridge;

internal static class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static async Task<int> Main()
    {
        try
        {
            var access = await Geolocator.RequestAccessAsync();

            if (access is not (GeolocationAccessStatus.Allowed or GeolocationAccessStatus.Unspecified))
            {
                Write(new
                {
                    ok = false,
                    status = "ACCESS_DENIED",
                    access = access.ToString(),
                    message = "Windows Location access is not available to this process.",
                    observedAt = DateTimeOffset.UtcNow,
                });
                return 2;
            }

            var locator = new Geolocator
            {
                DesiredAccuracy = PositionAccuracy.Default,
                MovementThreshold = 0,
            };

            var position = await locator.GetGeopositionAsync(
                TimeSpan.FromSeconds(10),
                TimeSpan.FromSeconds(30));

            var coordinate = position.Coordinate;
            var source = coordinate.PositionSource;
            var satellite = coordinate.SatelliteData;

            Write(new
            {
                ok = true,
                status = "AVAILABLE",
                provider = source.Type.ToString(),
                position = new
                {
                    latitude = coordinate.Point.Position.Latitude,
                    longitude = coordinate.Point.Position.Longitude,
                    accuracyMeters = coordinate.Accuracy,
                    altitudeMeters = coordinate.Altitude,
                    speedMetersPerSecond = coordinate.Speed,
                    headingDegrees = coordinate.Heading,
                    observedAt = coordinate.Timestamp,
                },
                satelliteData = satellite is null ? null : new
                {
                    satelliteCount = satellite.SatelliteCount,
                    horizontalDilutionOfPrecision = satellite.HorizontalDilutionOfPrecision,
                    verticalDilutionOfPrecision = satellite.VerticalDilutionOfPrecision,
                    positionDilutionOfPrecision = satellite.PositionDilutionOfPrecision,
                },
                observedAt = DateTimeOffset.UtcNow,
            });

            return 0;
        }
        catch (Exception ex)
        {
            Write(new
            {
                ok = false,
                status = "ERROR",
                error = ex.GetType().FullName,
                message = ex.Message,
                observedAt = DateTimeOffset.UtcNow,
            });
            return 1;
        }
    }

    private static void Write(object payload)
    {
        Console.WriteLine(JsonSerializer.Serialize(payload, JsonOptions));
    }
}
