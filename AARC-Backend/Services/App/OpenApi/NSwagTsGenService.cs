using NJsonSchema.CodeGeneration.TypeScript;
using NSwag;
using NSwag.CodeGeneration.TypeScript;

namespace AARC.Services.App.OpenApi
{
    public class NSwagTsGenService(
        IHttpContextAccessor httpContextAccessor)
    {
        public const string outputPath
            = "../AARC-Frontend/src/app/com/apiGenerated.ts";
        public async Task<int> GenApiTsClient()
        {
            var document = await GetOpenApiDocument();
            var settings = new TypeScriptClientGeneratorSettings();
            settings.TypeScriptGeneratorSettings.TypeStyle = TypeScriptTypeStyle.Interface;
            settings.ClassName = "{controller}Client";
            settings.Template = TypeScriptTemplate.Axios;
            var generator = new TypeScriptClientGenerator(document, settings);
            var code = generator.GenerateFile();
            using var outputStream = File.Open(outputPath, FileMode.Create);
            using var writer = new StreamWriter(outputStream);
            await writer.WriteAsync(code);
            writer.Flush();
            return code.Length;
        }
        public async Task<OpenApiDocument> GetOpenApiDocument()
        {
            var http = httpContextAccessor.HttpContext
                ?? throw new Exception("获取http上下文失败");
            var scheme = http.Request.Scheme;
            var host = http.Request.Host;
            var docName = NSwagService.documentName;
            var url = $"{scheme}://{host}/swagger/{docName}/swagger.json";
            var document = await OpenApiDocument.FromUrlAsync(url);
            return document;
        }
    }
}
