using NJsonSchema.CodeGeneration.TypeScript;
using NSwag;
using NSwag.CodeGeneration.TypeScript;

namespace AARC.Services.App.OpenApi
{
    public class NSwagTsGenService(
        IHttpContextAccessor httpContextAccessor)
    {
        public const string outputPath
            = "../aarc/src/app/com/apiGenerated.ts";
        public async Task<int> GenApiTsClient()
        {
            var document = await GetOpenApiDocument();
            var settings = new TypeScriptClientGeneratorSettings();
            settings.TypeScriptGeneratorSettings.TypeStyle = TypeScriptTypeStyle.Interface;
            settings.ClassName = "{controller}Client";
            settings.Template = TypeScriptTemplate.Axios;
            settings.UseAbortSignal = true;
            var generator = new TypeScriptClientGenerator(document, settings);
            var code = generator.GenerateFile();
            using var outputStream = File.Open(outputPath, FileMode.Create);
            using var writer = new StreamWriter(outputStream);
            await writer.WriteAsync(code);
            AppendFixes(writer);
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

        private const string unUsedImportFix
            = "let c:CancelToken|0=0;if(c){}";
        public void AppendFixes(StreamWriter sw)
        {
            sw.WriteLine();
            sw.WriteLine();
            sw.WriteLine("//修复“CancelToken导入未使用”的问题");
            sw.WriteLine(unUsedImportFix);
        }
    }
}
