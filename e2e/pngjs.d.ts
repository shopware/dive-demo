declare module 'pngjs' {
    type PNGImage = {
        data: Uint8Array;
        width: number;
        height: number;
    };

    export const PNG: {
        sync: {
            read(buffer: Uint8Array): PNGImage;
        };
    };
}
