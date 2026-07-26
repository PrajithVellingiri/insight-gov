"""
utils/logger.py – Structured stdout logger for the InsightGov AI service.

Usage:
    from utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info("Something happened")
"""

import logging
import sys


def get_logger(name: str) -> logging.Logger:
    """Return a named logger with a consistent stdout handler."""
    logger = logging.getLogger(name)

    # Avoid adding duplicate handlers when the module is imported multiple times
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False

    return logger
