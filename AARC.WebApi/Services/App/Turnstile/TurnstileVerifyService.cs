namespace AARC.Services.App.Turnstile;

public class TurnstileVerifyService(
    IConfiguration cfg,
    IHttpClientFactory httpFactory)
{
    public async Task Verify(string? token)
    {
        var secret = cfg["Turnstile:Secret"];
        var verifyUrl = cfg["Turnstile:VerifyUrl"];
        
        if(string.IsNullOrWhiteSpace(secret)  || string.IsNullOrWhiteSpace(verifyUrl))
            return;
        
        if(string.IsNullOrWhiteSpace(token))
            throw new RqEx("对不起，人机验证失败");
        
        var http = httpFactory.CreateClient();
        var content = new FormUrlEncodedContent([
            new KeyValuePair<string, string>("secret", secret),
            new KeyValuePair<string, string>("response", token)
        ]);
        var resp = await http.PostAsync(verifyUrl, content);
        var result = await resp.Content.ReadFromJsonAsync<TurnstileResponse>();

        if (result is null || !result.Success)
            throw new RqEx("对不起，人机验证失败");
    }
    private record TurnstileResponse(bool Success);
}