export type LogFunction = (message: any, ...args: any[]) => void;

export interface LogFunctions {
    debug: LogFunction;
    info: LogFunction;
    log: LogFunction;
    warn: LogFunction;
    error: LogFunction;
}

let _logger: LogFunctions = console;

const Logger: LogFunctions = {
    debug(message: any, ...args: any[]) {
        _logger.debug(message, ...args);
    },
    info(message: any, ...args: any[]) {
        _logger.info(message, ...args);
    },
    log(message: any, ...args: any[]) {
        _logger.log(message, ...args);
    },
    warn(message: any, ...args: any[]) {
        _logger.warn(message, ...args);
    },
    error(message: any, ...args: any[]) {
        _logger.error(message, ...args);
    },
};

export function setLogger(logging: LogFunctions) {
    _logger = logging || console;
}

export default Logger;
