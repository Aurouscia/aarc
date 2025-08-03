export async function compressObjectToGzip(data: object):Promise<Blob|'notSupported'> {
    if (!('CompressionStream' in window)) {
        return 'notSupported'
    }

    const jsonString = JSON.stringify(data);

    // 创建一个可读流
    const readableStream = new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode(jsonString));
            controller.close();
        }
    });

    // 创建 gzip 压缩流
    const compressionStream = new CompressionStream('gzip');

    // 将可读流通过压缩流进行压缩
    const compressedStream = readableStream.pipeThrough(compressionStream);

    // 用于存储压缩后的数据块
    const chunks: Uint8Array<ArrayBuffer>[] = [];

    // 创建一个 WritableStream 来收集数据
    const writer = new WritableStream({
        write(chunk) {
            // 将数据块添加到数组中
            chunks.push(chunk);
        },
        close() {
            console.log("Compression complete.");
        },
        abort(err) {
            console.error("Compression aborted:", err);
        }
    });

    // 将压缩后的流数据写入自定义的 WritableStream
    await compressedStream.pipeTo(writer);

    // 使用收集到的数据创建 Blob 对象
    const blob = new Blob(chunks, { type: 'application/gzip' });

    return blob;
}