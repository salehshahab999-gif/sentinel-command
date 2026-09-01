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
            var locator = new Geolocator
            {
                DesiredAccuracy = PositionAccuracy.Default,
                MovementThreshold = 0,
            };

            var position = await locator.GetGeopositionAsync(
                TimeSpan.FromSeconds(10),
                TimeSpan.FromSeconds(30));

            var coordinate = position.Coordinate;
            var satellite = coordinate.SatelliteData;

            Write(new
            {
                ok = true,
                status = "AVAILABLE",
                provider = coordinate.PositionSource.ToString(),
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
                    horizontalDilutionOfPrecision = satellite.HorizontalDilutionOfPrecision,
                    verticalDilutionOfPrecision = satellite.VerticalDilutionOfPrecision,
                    positionDilutionOfPrecision = satellite.PositionDilutionOfPrecision,
                },
                observedAt = DateTimeOffset.UtcNow,
            });

            return 0;
        }
        catch (UnauthorizedAccessException ex)
        {
            Write(new
            {
                ok = false,
                status = "ACCESS_DENIED",
                error = ex.GetType().FullName,
                message = ex.Message,
                action = "Enable Windows Location and allow this application to access location.",
                settingsUri = "ms-settings:privacy-location",
                observedAt = DateTimeOffset.UtcNow,
            });
            return 2;
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
