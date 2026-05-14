using NJsonSchema.CodeGeneration.TypeScript;
using NSwag;
using NSwag.CodeGeneration.TypeScript;

namespace AARC.WebApi.Services.App.OpenApi
{
    public class NSwagTsGenService(
        IHttpContextAccessor httpContextAccessor)
    {
        public const string defaultOutputPath
            = "../aarc/src/app/com/apiGenerated.ts";
        public const string hereOutputPath
            = "./apiGenerated.ts";
        public async Task<int> GenApiTsClient(bool writeHere = false)
        {
            var document = await GetOpenApiDocument();
            var settings = new TypeScriptClientGeneratorSettings();
            settings.TypeScriptGeneratorSettings.TypeStyle = TypeScriptTypeStyle.Interface;
            settings.ClassName = "{controller}Client";
            settings.Template = TypeScriptTemplate.Axios;
            settings.UseAbortSignal = true;
            var generator = new TypeScriptClientGenerator(document, settings);
            var code = generator.GenerateFile();
            code = ReplaceFixes(code);
            var outputPath = writeHere ? hereOutputPath : defaultOutputPath;
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

        /// <summary>
        /// 修复 Blob 的 type 问题
        /// </summary>
        public string ReplaceFixes(string code)
        {
            return code.Replace(
                "new Blob([response.data], { type: response.headers[\"content-type\"] })",
                "new Blob([response.data], { type: String(response.headers[\"content-type\"] || \"\") })"
                );
        }

        private const string unUsedImportFix
            = "let c:CancelToken|0=0;if(c){}";
        /// <summary>
        /// 修复 CancelToken 导入未使用的问题
        /// </summary>
        public void AppendFixes(StreamWriter sw)
        {
            sw.WriteLine();
            sw.WriteLine();
            sw.WriteLine("//修复“CancelToken导入未使用”的问题");
            sw.WriteLine(unUsedImportFix);
        }
    }
}
