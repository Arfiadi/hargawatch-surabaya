"""Unit tests for scraper CSV resume data-preservation fix.

Verifies that resuming a scrape job preserves existing rows from a previous
run instead of overwriting them with only the newly scraped data.
"""

import csv


def _write_csv(path, fieldnames, rows):
    """Helper: write rows to a CSV with BOM."""
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


# =====================================================================
# Tests for scrape_data.py
# =====================================================================

class TestScrapeDataResume:
    """Tests for src.pipeline.scrape_data.baca_tanggal_selesai."""

    FIELDNAMES = ["tanggal", "komoditas_id", "komoditas", "grup", "satuan",
                  "harga_kemarin", "harga"]

    def test_empty_file_returns_empty(self, tmp_path):
        from src.pipeline.scrape_data import baca_tanggal_selesai

        csv_path = str(tmp_path / "empty.csv")
        done, rows = baca_tanggal_selesai(csv_path)
        assert done == set()
        assert rows == []

    def test_nonexistent_file_returns_empty(self, tmp_path):
        from src.pipeline.scrape_data import baca_tanggal_selesai

        csv_path = str(tmp_path / "does_not_exist.csv")
        done, rows = baca_tanggal_selesai(csv_path)
        assert done == set()
        assert rows == []

    def test_existing_csv_returns_dates_and_rows(self, tmp_path):
        from src.pipeline.scrape_data import baca_tanggal_selesai

        csv_path = str(tmp_path / "pasar.csv")
        old_rows = [
            {"tanggal": "2024-01-01", "komoditas_id": "50", "komoditas": "Cabe Rawit Merah",
             "grup": "CABE", "satuan": "Kg", "harga_kemarin": "30000", "harga": "31000"},
            {"tanggal": "2024-01-01", "komoditas_id": "39", "komoditas": "Bawang Merah",
             "grup": "BAWANG", "satuan": "Kg", "harga_kemarin": "25000", "harga": "26000"},
            {"tanggal": "2024-01-02", "komoditas_id": "50", "komoditas": "Cabe Rawit Merah",
             "grup": "CABE", "satuan": "Kg", "harga_kemarin": "31000", "harga": "32000"},
        ]
        _write_csv(csv_path, self.FIELDNAMES, old_rows)

        done, rows = baca_tanggal_selesai(csv_path)
        assert done == {"2024-01-01", "2024-01-02"}
        assert len(rows) == 3
        assert rows[0]["komoditas"] == "Cabe Rawit Merah"

    def test_resume_preserves_old_data_in_output(self, tmp_path):
        """Integration test: simulate resume by writing old CSV, loading it,
        appending new data, then writing back — old rows must survive."""
        from src.pipeline.scrape_data import baca_tanggal_selesai, tulis_csv

        csv_path = str(tmp_path / "pasar.csv")

        # Phase 1: write "old" data (simulating a previous run)
        old_rows = [
            {"tanggal": "2024-01-01", "komoditas_id": "50", "komoditas": "Cabe Rawit Merah",
             "grup": "CABE", "satuan": "Kg", "harga_kemarin": "30000", "harga": "31000"},
            {"tanggal": "2024-01-02", "komoditas_id": "50", "komoditas": "Cabe Rawit Merah",
             "grup": "CABE", "satuan": "Kg", "harga_kemarin": "31000", "harga": "32000"},
        ]
        _write_csv(csv_path, self.FIELDNAMES, old_rows)

        # Phase 2: "resume" — load old data
        done, baris_lama = baca_tanggal_selesai(csv_path)
        semua_baris = list(baris_lama)  # <-- THE FIX: seed from old data

        # Phase 3: append "new" scraped data
        new_row = {"tanggal": "2024-01-03", "komoditas_id": "50", "komoditas": "Cabe Rawit Merah",
                   "grup": "CABE", "satuan": "Kg", "harga_kemarin": "32000", "harga": "33000"}
        semua_baris.append(new_row)

        # Phase 4: write combined output
        tulis_csv(csv_path, semua_baris)

        # Verify: all 3 rows must be present
        with open(csv_path, newline="", encoding="utf-8-sig") as f:
            result = list(csv.DictReader(f))
        assert len(result) == 3
        tanggal_set = {r["tanggal"] for r in result}
        assert tanggal_set == {"2024-01-01", "2024-01-02", "2024-01-03"}


# =====================================================================
# Tests for scrape_produsen.py
# =====================================================================

class TestScrapeProdusenResume:
    """Tests for src.pipeline.scrape_produsen.baca_tanggal_selesai."""

    FIELDNAMES = ["tanggal", "komoditas", "titik_pantau", "kabupaten",
                  "satuan", "harga_kemarin", "harga"]

    def test_empty_file_returns_empty(self, tmp_path):
        from src.pipeline.scrape_produsen import baca_tanggal_selesai

        csv_path = str(tmp_path / "empty.csv")
        done, rows = baca_tanggal_selesai(csv_path)
        assert done == set()
        assert rows == []

    def test_nonexistent_file_returns_empty(self, tmp_path):
        from src.pipeline.scrape_produsen import baca_tanggal_selesai

        csv_path = str(tmp_path / "nope.csv")
        done, rows = baca_tanggal_selesai(csv_path)
        assert done == set()
        assert rows == []

    def test_existing_csv_returns_dates_and_rows(self, tmp_path):
        from src.pipeline.scrape_produsen import baca_tanggal_selesai

        csv_path = str(tmp_path / "prod.csv")
        old_rows = [
            {"tanggal": "2024-01-01", "komoditas": "Daging Sapi",
             "titik_pantau": "RPH Pegirikan", "kabupaten": "Kota Surabaya",
             "satuan": "Kg", "harga_kemarin": "120000", "harga": "125000"},
            {"tanggal": "2024-01-02", "komoditas": "Daging Sapi",
             "titik_pantau": "RPH Pegirikan", "kabupaten": "Kota Surabaya",
             "satuan": "Kg", "harga_kemarin": "125000", "harga": "126000"},
        ]
        _write_csv(csv_path, self.FIELDNAMES, old_rows)

        done, rows = baca_tanggal_selesai(csv_path)
        assert done == {"2024-01-01", "2024-01-02"}
        assert len(rows) == 2

    def test_resume_preserves_old_data_in_output(self, tmp_path):
        """Integration test: old data must survive a resume + write cycle."""
        from src.pipeline.scrape_produsen import baca_tanggal_selesai, tulis_csv

        csv_path = str(tmp_path / "prod.csv")

        # Phase 1: old data
        old_rows = [
            {"tanggal": "2024-01-01", "komoditas": "Daging Sapi",
             "titik_pantau": "RPH Pegirikan", "kabupaten": "Kota Surabaya",
             "satuan": "Kg", "harga_kemarin": "120000", "harga": "125000"},
        ]
        _write_csv(csv_path, self.FIELDNAMES, old_rows)

        # Phase 2: resume
        done, baris_lama = baca_tanggal_selesai(csv_path)
        semua_baris = list(baris_lama)

        # Phase 3: new data
        semua_baris.append(
            {"tanggal": "2024-01-02", "komoditas": "Daging Sapi",
             "titik_pantau": "RPH Pegirikan", "kabupaten": "Kota Surabaya",
             "satuan": "Kg", "harga_kemarin": "125000", "harga": "126000"})

        # Phase 4: write
        tulis_csv(csv_path, semua_baris)

        # Verify
        with open(csv_path, newline="", encoding="utf-8-sig") as f:
            result = list(csv.DictReader(f))
        assert len(result) == 2
        assert {r["tanggal"] for r in result} == {"2024-01-01", "2024-01-02"}


# =====================================================================
# Regression test: --no-resume still works (scrape_data only)
# =====================================================================

class TestScrapeMainResumeOrchestration:
    """Exercises the real ``main()`` orchestration, where the resume bug lived."""

    FIELDNAMES = TestScrapeDataResume.FIELDNAMES

    @staticmethod
    def _old_row(harga: str = "31000") -> dict:
        return {
            "tanggal": "2024-01-01",
            "komoditas_id": "50",
            "komoditas": "Cabe Rawit Merah",
            "grup": "CABE",
            "satuan": "Kg",
            "harga_kemarin": "30000",
            "harga": harga,
        }

    def _install_mocks(self, monkeypatch, calls: list[str]):
        from src.pipeline import scrape_data

        monkeypatch.setattr(scrape_data, "cari_pasar", lambda *a, **k: (1, "Pasar Uji"))

        def fake_get_html_table(tgl, *args, **kwargs):
            calls.append(tgl)
            return "<html></html>"

        monkeypatch.setattr(scrape_data, "get_html_table", fake_get_html_table)
        monkeypatch.setattr(
            scrape_data,
            "parse_tabel",
            lambda html: [{
                "komoditas_id": 50,
                "komoditas": "Cabe Rawit Merah",
                "grup": "CABE",
                "satuan": "Kg",
                "harga_kemarin": 32000,
                "harga": 33000,
            }],
        )
        monkeypatch.setattr(scrape_data, "is_pangan", lambda *a: True)
        monkeypatch.setattr(scrape_data.time, "sleep", lambda *_: None)
        return scrape_data

    @staticmethod
    def _read_csv(path) -> list[dict]:
        with open(path, newline="", encoding="utf-8-sig") as f:
            return list(csv.DictReader(f))

    def test_main_resume_preserves_old_rows_and_skips_done_dates(self, tmp_path, monkeypatch):
        csv_path = tmp_path / "pasar.csv"
        _write_csv(csv_path, self.FIELDNAMES, [self._old_row()])

        calls: list[str] = []
        scrape_data = self._install_mocks(monkeypatch, calls)

        scrape_data.main([
            "--mulai", "2024-01-02",
            "--akhir", "2024-01-03",
            "--output", str(csv_path),
            "--parallel", "1",
        ])

        rows = self._read_csv(csv_path)
        assert {r["tanggal"] for r in rows} == {"2024-01-01", "2024-01-02", "2024-01-03"}
        assert rows[0]["harga"] == "31000"  # old row preserved
        assert all(r["harga"] == "33000" for r in rows[1:])
        assert set(calls) == {"2024-01-02", "2024-01-03"}
        assert "2024-01-01" not in calls  # already-done date must not be re-scraped
        assert (tmp_path / "pasar.json").exists()

    def test_main_no_resume_discards_existing_rows(self, tmp_path, monkeypatch):
        csv_path = tmp_path / "pasar.csv"
        _write_csv(csv_path, self.FIELDNAMES, [self._old_row(harga="99999")])

        calls: list[str] = []
        scrape_data = self._install_mocks(monkeypatch, calls)

        scrape_data.main([
            "--mulai", "2024-01-03",
            "--akhir", "2024-01-03",
            "--output", str(csv_path),
            "--parallel", "1",
            "--no-resume",
        ])

        rows = self._read_csv(csv_path)
        assert {r["tanggal"] for r in rows} == {"2024-01-03"}
        assert all(r["harga"] != "99999" for r in rows)
        assert calls == ["2024-01-03"]
