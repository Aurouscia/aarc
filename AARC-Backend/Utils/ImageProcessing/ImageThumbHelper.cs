using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Memory;
using SixLabors.ImageSharp.Processing;

namespace AARC.Utils.ImageProcessing
{
    public class ImageThumbHelper
    {
        private const long maxPixels = 500_000_000;
        private const int maxMemoryMb = 128;

        /// <summary>
        /// 把输入流中的图缩小到指定边长（若原图更大）并转为较低质量的<see cref="thumbFileExt"/>格式<br/>
        /// 若图太大或处理时超限会抛出 <see cref="InvalidOperationException"/>。
        /// </summary>
        public static bool Thumb(
            Stream input,
            Stream output,
            int longEdge = 256)
        {
            ImageInfo info;
            if (input.CanSeek)
                input.Seek(0, SeekOrigin.Begin);
            try
            {
                info = Image.Identify(input);
            }
            catch (UnknownImageFormatException)
            {
                throw new InvalidOperationException("无法识别图片格式");
            }
            if (info is null)
                throw new InvalidOperationException("图片信息识别失败");
            if (info.Width * info.Height > maxPixels)
                throw new InvalidOperationException($"图片像素 {info.Width * info.Height:N0} 超过上限 {maxPixels:N0}");

            input.Seek(0, SeekOrigin.Begin);
            using var image = Image.Load(ThumbDecoderOptions.Value, input);

            int max = Math.Max(image.Width, image.Height);
            if (max > longEdge)
            {
                Size newSize = image.Width >= image.Height
                    ? new Size(longEdge, (int)(image.Height * (longEdge / (double)image.Width)))
                    : new Size((int)(image.Width * (longEdge / (double)image.Height)), longEdge);
                image.Mutate(ctx => ctx.Resize(newSize));
                image.Save(output, ThumbEncoder.Value);
                return true;
            }
            return false;
        }

        private static Lazy<Configuration> ThumbConfiguration { get; } = new(() =>
        {
            var cfg = Configuration.Default.Clone();
            cfg.MemoryAllocator = MemoryAllocator.Create(
                new MemoryAllocatorOptions { AllocationLimitMegabytes = maxMemoryMb });
            return cfg;
        });
        private static Lazy<DecoderOptions> ThumbDecoderOptions { get; } = new(() =>
        {
            return new()
            {
                Configuration = ThumbConfiguration.Value,
                MaxFrames = 1
            };
        });

        public const string thumbFileExt = ".webp";
        private static Lazy<IImageEncoder> ThumbEncoder { get; } = new(() =>
        {
            return new WebpEncoder
            {
                Quality = 50,
                FileFormat = WebpFileFormatType.Lossy,
                Method = WebpEncodingMethod.Fastest
            };
        });
    }
}
