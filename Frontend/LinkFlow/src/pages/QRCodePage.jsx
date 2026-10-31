import { useEffect, useState } from "react";
import {
  Download,
  QrCode,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";

import QRCode from "qrcode";

export default function QRCodePage({ links = [] }) {
  const [selectedLinkId, setSelectedLinkId] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (links.length === 0) {
      setSelectedLinkId("");
      setQrImage("");
      return;
    }

    setSelectedLinkId((current) => {
      const exists = links.some(
        (link) => String(link.id) === String(current)
      );

      return exists ? current : String(links[0].id);
    });
  }, [links]);

  const selectedLink = links.find(
    (link) => String(link.id) === String(selectedLinkId)
  );

 async function handleGenerate() {
  if (!selectedLink) {
    setError("Select a short link first.");
    return;
  }

  const targetUrl = selectedLink.shortUrl;

  if (!targetUrl) {
    setError("The selected link does not have a short URL.");
    return;
  }

  setError("");
  setQrImage("");
  setLoading(true);

  try {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "H",
      type: "image/png",
    });

    setQrImage(dataUrl);
  } catch (err) {
    setError(err?.message || "Failed to generate the QR code.");
  } finally {
    setLoading(false);
  }
}

  function handleDownload() {
    if (!qrImage) return;

    const anchor = document.createElement("a");
    anchor.href = qrImage;
    anchor.download = `linkflow-qr-${selectedLinkId}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  if (links.length === 0) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-900/50 p-8 text-center">
        <QrCode size={36} className="text-indigo-400" />

        <h1 className="mt-4 text-xl font-semibold text-white">
          QR Codes
        </h1>

        <p className="mt-2 max-w-md text-sm text-slate-400">
          Create a short link before generating its QR code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">QR Codes</h1>

        <p className="mt-2 text-sm text-slate-400">
          Generate downloadable QR codes for your short links.
        </p>
      </div>

      <section className="grid gap-6 rounded-xl border border-white/10 bg-slate-900/70 p-6 lg:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-300">
            Select a short link
          </label>

          <select
            value={selectedLinkId}
            onChange={(event) => {
              setSelectedLinkId(event.target.value);
              setQrImage("");
              setError("");
            }}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
          >
            {links.map((link) => (
              <option key={link.id} value={String(link.id)}>
                {link.title || link.slug || link.shortUrl}
              </option>
            ))}
          </select>

          {selectedLink && (
            <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs text-slate-500">Destination</p>

              <p className="mt-1 break-all text-sm text-slate-300">
                {selectedLink.originalUrl}
              </p>

              <p className="mt-4 text-xs text-slate-500">Short link</p>

              <p className="mt-1 break-all text-sm text-indigo-300">
                {selectedLink.shortUrl}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !selectedLink}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={17} />
            )}

            {loading ? "Generating..." : "Generate QR Code"}
          </button>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-slate-950/50 p-6">
          {qrImage ? (
            <>
              <img
                src={qrImage}
                alt="Generated QR code"
                className="h-56 w-56 rounded-lg bg-white p-3"
              />

              <button
                type="button"
                onClick={handleDownload}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
              >
                <Download size={17} />
                Download PNG
              </button>
            </>
          ) : (
            <>
              <QrCode size={48} className="text-slate-600" />

              <p className="mt-4 text-sm font-medium text-slate-300">
                Your QR code will appear here
              </p>

              <p className="mt-2 text-center text-xs text-slate-500">
                Select a link and generate its QR code.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}