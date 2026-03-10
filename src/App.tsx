import { useState, useEffect } from "react";

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const handleProgress = (data: string) => {
      setLogs((prev) => [...prev, data.trim()]);
      setStatus("Downloading");
    };

    const handleComplete = (data: string) => {
      setLogs((prev) => [...prev, data.trim()]);
      setStatus("Complete");
    };

    const handleError = (data: string) => {
      setLogs((prev) => [...prev, data.trim()]);
      setStatus("Error");
    };

    window.backend.onDownloadProgress(handleProgress);
    window.backend.onDownloadComplete(handleComplete);
    window.backend.onDownloadError(handleError);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url) {
      return;
    }

    setStatus("Initializing...");
    setLogs([]);

    await window.backend.startDownload(url);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Playlist Downloader</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
              placeholder="https://youtube.com/playlist?list=..."
              onChange={(e) => setUrl(e.target.value)}
              type="text"
              value={url}
              id="url"
            />
            <button type="submit" disabled={status === "Downloading" || !url} className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${status === "Downloading" || !url ? "bg-gray-600 cursor-not-allowed text-gray-400" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30"}`}>
              {status === "Downloading" ? "Downloading..." : "Start Download"}
            </button>
          </form>

          {status !== "" && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Status:</span>
                <span className={`text-sm font-bold ${status === "Error" ? "text-red-400" : "text-green-400"}`}>{status}</span>
              </div>

              <div className="bg-black/50 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs text-gray-300 border border-gray-700">
                {logs.length === 0 ? (
                  <span className="text-gray-500 italic">Waiting for output...</span>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1 break-all">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
