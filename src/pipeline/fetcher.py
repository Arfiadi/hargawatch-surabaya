"""Robust HTTP client with exponential backoff and retry for SISKAPERBAPO & Open-Meteo."""

import logging
import time
from typing import Dict, Optional, Union
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
]


class RobustDataFetcher:
    """Session-managed HTTP fetcher with connection pooling, retries, and backoff."""

    def __init__(
        self,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
        timeout: int = 15,
        status_forcelist: Optional[list] = None
    ):
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.status_forcelist = status_forcelist or [429, 500, 502, 503, 504]

        self.session = requests.Session()
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=self.backoff_factor,
            status_forcelist=self.status_forcelist,
            raise_on_status=False
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def get(
        self,
        url: str,
        params: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        timeout: Optional[int] = None
    ) -> requests.Response:
        """Executes GET request with timeout and default browser user-agent."""
        req_headers = {"User-Agent": DEFAULT_USER_AGENTS[0]}
        if headers:
            req_headers.update(headers)

        t = timeout or self.timeout
        return self.session.get(url, params=params, headers=req_headers, timeout=t)

    def post(
        self,
        url: str,
        data: Optional[Union[Dict, str]] = None,
        json: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        timeout: Optional[int] = None
    ) -> requests.Response:
        """Executes POST request with timeout and default browser user-agent."""
        req_headers = {"User-Agent": DEFAULT_USER_AGENTS[0]}
        if headers:
            req_headers.update(headers)

        t = timeout or self.timeout
        return self.session.post(url, data=data, json=json, headers=req_headers, timeout=t)

    def close(self):
        """Closes the underlying requests session."""
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
