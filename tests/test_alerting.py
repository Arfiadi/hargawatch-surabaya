"""Unit tests untuk modul observabilitas dan Telegram alerting."""

from unittest.mock import MagicMock, patch

from src.utils.utils_alerting import send_telegram_alert


def test_telegram_alert_graceful_handling_when_unconfigured(monkeypatch):
    """Memastikan sistem tidak crash jika token/chat_id belum dikonfigurasi."""
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "isi_token_bot_telegram_di_sini")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "isi_chat_id_telegram_di_sini")

    # Harus mengembalikan False secara elegan tanpa melempar Exception
    result = send_telegram_alert("Pesan uji coba")
    assert result is False


def test_telegram_alert_success_mock(monkeypatch):
    """Memastikan payload dan timeout dikirimkan dengan benar saat kredensial valid."""
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "123456:ABC-DEF")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "-100987654321")

    with patch("requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200)

        result = send_telegram_alert("🚨 *[HargaWatch Test Alert]*")
        assert result is True
        mock_post.assert_called_once()

        args, kwargs = mock_post.call_args
        assert "123456:ABC-DEF" in args[0]
        assert kwargs["json"]["chat_id"] == "-100987654321"
        assert kwargs["json"]["text"] == "🚨 *[HargaWatch Test Alert]*"
        assert kwargs["json"]["parse_mode"] == "Markdown"
        assert kwargs["timeout"] == 10


def test_telegram_alert_returns_false_on_http_error(monkeypatch):
    """HTTP non-200 harus ditangani sebagai kegagalan, bukan exception."""
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "123456:ABC-DEF")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "-100987654321")

    with patch("requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=500, text="internal error")

        assert send_telegram_alert("Pesan uji coba") is False


def test_telegram_alert_returns_false_on_network_exception(monkeypatch):
    """Exception jaringan tidak boleh membuat pipeline crash."""
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "123456:ABC-DEF")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "-100987654321")

    with patch("requests.post", side_effect=ConnectionError("timeout")):
        assert send_telegram_alert("Pesan uji coba") is False
