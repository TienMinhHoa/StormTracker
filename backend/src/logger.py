import logging
import os
from logging.handlers import RotatingFileHandler
from src.constants import LogLevel
from src.config import config


def setup_logger():
    os.makedirs(config.LOG_DIR, exist_ok=True)

    log_file_path = os.path.join(config.LOG_DIR, f"{config.APP_NAME.lower()}.log")

    log_format = "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL.value, LogLevel.INFO.value),
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(),  # logs to console
            RotatingFileHandler(
                log_file_path,
                maxBytes=5_000_000,
                backupCount=5,
                encoding="utf-8",
            ),
        ],
    )

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)

    logger = logging.getLogger(config.APP_NAME)
    logger.info(
        f"Logger initialized (level={config.LOG_LEVEL.value}, env={config.APP_ENV.value})"
    )

    return logger


logger = setup_logger()