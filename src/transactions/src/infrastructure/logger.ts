import { Injectable } from '@nestjs/common';

@Injectable()
export class Logger {
    info = (message: string) => {
        console.log(message);
    };
}