from loguru import logger
import logging

class InterceptorHandler(logging.Handler):
    def emit(self, record):
        try:
            # Convertir el nivel de log de logging a Loguru
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Calcular la profundidad del stack para que Loguru muestre el lugar correcto del log
        frame, depth = logging.currentframe(), 2
        # Ignorar los frames de logging para llegar al origen del log
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())