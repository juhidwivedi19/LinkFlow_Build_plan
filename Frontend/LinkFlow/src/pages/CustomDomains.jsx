import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
Globe,
Plus,
Copy,
Check,
RefreshCw,
Trash2,
ShieldCheck,
Clock,
ArrowLeft,
X,
} from "lucide-react";

import {
getCustomDomains,
createCustomDomain,
verifyCustomDomain,
deleteCustomDomain,
} from "../api/domain.api";

export default function CustomDomains() {
const { workspaceId } = useParams();
const navigate = useNavigate();

const [domains, setDomains] = useState([]);
const [loading, setLoading] = useState(true);
const [adding, setAdding] = useState(false);
const [verifyingId, setVerifyingId] = useState(null);
const [deletingId, setDeletingId] = useState(null);

const [showModal, setShowModal] = useState(false);
const [domainInput, setDomainInput] = useState("");
const [selectedDomain, setSelectedDomain] = useState(null);

const [copied, setCopied] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const loadDomains = useCallback(async () => {
try {
setLoading(true);
setError("");


  const response = await getCustomDomains(workspaceId);

  setDomains(response.domains || []);
} catch (err) {
  setError(err.message || "Failed to load custom domains.");
} finally {
  setLoading(false);
}


}, [workspaceId]);

useEffect(() => {
loadDomains();
}, [loadDomains]);

async function handleAddDomain(e) {
e.preventDefault();


try {
  setAdding(true);
  setError("");
  setSuccess("");

  const normalizedDomain = domainInput.trim().toLowerCase();

  const response = await createCustomDomain(
    workspaceId,
    normalizedDomain
  );

  const newDomain = response.domain;

  setDomains((current) => [newDomain, ...current]);

  setDomainInput("");
  setShowModal(false);

  setSelectedDomain(newDomain);

  setSuccess("Custom domain added successfully.");
} catch (err) {
  setError(err.message || "Failed to add domain.");
} finally {
  setAdding(false);
}


}

async function handleVerifyDomain(domainId) {
try {
setVerifyingId(domainId);
setError("");
setSuccess("");


  const response = await verifyCustomDomain(
    workspaceId,
    domainId
  );

  setDomains((current) =>
    current.map((domain) =>
      domain.id === domainId
        ? response.domain
        : domain
    )
  );

  setSelectedDomain(response.domain);

  setSuccess(
    response.domain.verified
      ? "Domain verified successfully."
      : response.message
  );
} catch (err) {
  setError(err.message || "Domain verification failed.");
} finally {
  setVerifyingId(null);
}


}

async function handleDeleteDomain(domainId) {
const confirmed = window.confirm(
"Are you sure you want to delete this custom domain?"
);


if (!confirmed) return;

try {
  setDeletingId(domainId);
  setError("");
  setSuccess("");

  await deleteCustomDomain(workspaceId, domainId);

  setDomains((current) =>
    current.filter((domain) => domain.id !== domainId)
  );

  if (selectedDomain?.id === domainId) {
    setSelectedDomain(null);
  }

  setSuccess("Custom domain deleted successfully.");
} catch (err) {
  setError(err.message || "Failed to delete domain.");
} finally {
  setDeletingId(null);
}


}

async function copyToken(token) {
try {
await navigator.clipboard.writeText(token);
setCopied(true);


  setTimeout(() => setCopied(false), 2000);
} catch {
  setError("Unable to copy verification token.");
}


}

function getDomainStatus(domain) {
return domain.verified ? "Verified" : "Pending";
}

const verifiedCount = domains.filter(
(domain) => domain.verified
).length;

const pendingCount = domains.length - verifiedCount;

return ( <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-10">


  {/* Header */}
  <div className="mx-auto max-w-6xl">

    <button
     onClick={() => navigate(`/workspaces/${workspaceId}`)}
      className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
    >
      <ArrowLeft size={16} />
      Back to Dashboard
    </button>

    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

      <div>
        <div className="mb-2 flex items-center gap-3">
          <Globe className="text-blue-400" size={28} />

          <h1 className="text-2xl font-bold sm:text-3xl">
            Custom Domains
          </h1>
        </div>

        <p className="text-sm text-slate-400">
          Connect your own domain and create branded short links.
        </p>
      </div>

      <button
        onClick={() => {
          setError("");
          setShowModal(true);
        }}
        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500"
      >
        <Plus size={18} />
        Add Domain
      </button>

    </div>

    {/* Messages */}
    {error && (
      <div className="mb-5 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        {error}
        <button onClick={() => setError("")}>
          <X size={18} />
        </button>
      </div>
    )}

    {success && (
      <div className="mb-5 flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
        {success}
        <button onClick={() => setSuccess("")}>
          <X size={18} />
        </button>
      </div>
    )}

    {/* Statistics */}
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

      <StatCard
        title="Total Domains"
        value={domains.length}
        icon={<Globe size={20} />}
      />

      <StatCard
        title="Verified"
        value={verifiedCount}
        icon={<ShieldCheck size={20} />}
      />

      <StatCard
        title="Pending"
        value={pendingCount}
        icon={<Clock size={20} />}
      />

    </div>

    {/* Domain List */}
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-lg font-semibold">
            Your Domains
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Manage and verify your connected domains.
          </p>
        </div>

        <button
          onClick={loadDomains}
          disabled={loading}
          className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
          title="Refresh domains"
        >
          <RefreshCw
            size={18}
            className={loading ? "animate-spin" : ""}
          />
        </button>

      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          Loading domains...
        </div>
      ) : domains.length === 0 ? (
        <div className="py-16 text-center">

          <Globe
            size={42}
            className="mx-auto mb-4 text-slate-600"
          />

          <h3 className="mb-2 text-lg font-semibold">
            No custom domains yet
          </h3>

          <p className="mb-5 text-sm text-slate-400">
            Connect your first domain to start creating branded links.
          </p>

          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 hover:bg-blue-500"
          >
            Add Your First Domain
          </button>

        </div>
      ) : (

        <div className="space-y-4">

          {domains.map((domain) => (

            <div
              key={domain.id}
              className="flex flex-col justify-between gap-5 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center"
            >

              <div className="min-w-0">

                <div className="mb-2 flex flex-wrap items-center gap-3">

                  <Globe size={18} className="text-blue-400" />

                  <h3 className="break-all font-semibold">
                    {domain.domain}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      domain.verified
                        ? "bg-green-500/10 text-green-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {getDomainStatus(domain)}
                  </span>

                </div>

                <p className="text-xs text-slate-500">
                  Added:{" "}
                  {new Date(domain.createdAt).toLocaleDateString()}
                </p>

              </div>

              <div className="flex flex-wrap gap-2">

                {!domain.verified && (
                  <button
                    onClick={() => setSelectedDomain(domain)}
                    className="rounded-lg border border-blue-500/40 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10"
                  >
                    DNS Setup
                  </button>
                )}

                {!domain.verified && (
                  <button
                    onClick={() =>
                      handleVerifyDomain(domain.id)
                    }
                    disabled={verifyingId === domain.id}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500 disabled:opacity-50"
                  >
                    {verifyingId === domain.id
                      ? "Verifying..."
                      : "Verify"}
                  </button>
                )}

                <button
                  onClick={() =>
                    handleDeleteDomain(domain.id)
                  }
                  disabled={deletingId === domain.id}
                  className="rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10"
                  title="Delete domain"
                >
                  <Trash2 size={17} />
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>

  </div>

  {/* Add Domain Modal */}
  {showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="mb-5 flex items-center justify-between">

          <h2 className="text-xl font-semibold">
            Add Custom Domain
          </h2>

          <button onClick={() => setShowModal(false)}>
            <X size={20} className="text-slate-400" />
          </button>

        </div>

        <form onSubmit={handleAddDomain}>

          <label className="mb-2 block text-sm text-slate-300">
            Domain Name
          </label>

          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="go.mycompany.com"
            required
            className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
          />

          <p className="mb-5 text-xs text-slate-500">
            Enter a hostname only. Do not include https:// or a path.
          </p>

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-slate-700 px-4 py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={adding || !domainInput.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 hover:bg-blue-500 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add Domain"}
            </button>

          </div>

        </form>

      </div>

    </div>
  )}

  {/* DNS Instructions Modal */}
  {selectedDomain && !selectedDomain.verified && (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="mb-5 flex items-center justify-between">

          <h2 className="text-xl font-semibold">
            Verify Domain Ownership
          </h2>

          <button onClick={() => setSelectedDomain(null)}>
            <X size={20} className="text-slate-400" />
          </button>

        </div>

        <p className="mb-5 text-sm text-slate-400">
          Add the following DNS TXT record to your domain provider.
        </p>

        <div className="mb-4 rounded-xl bg-slate-950 p-4">

          <p className="mb-2 text-xs text-slate-500">
            Record Type
          </p>

          <p className="mb-4 font-semibold">TXT</p>

          <p className="mb-2 text-xs text-slate-500">
            Host / Name
          </p>

          <p className="mb-4 break-all text-sm text-blue-400">
            _linkflow-verification.{selectedDomain.domain}
          </p>

          <p className="mb-2 text-xs text-slate-500">
            Value
          </p>

          <div className="flex items-center gap-2">

            <p className="min-w-0 flex-1 break-all text-sm">
              {selectedDomain.verificationToken ||
                "Verification token unavailable"}
            </p>

            <button
              onClick={() =>
                copyToken(selectedDomain.verificationToken)
              }
              disabled={!selectedDomain.verificationToken}
              className="shrink-0 rounded-lg border border-slate-700 p-2 hover:bg-slate-800 disabled:opacity-40"
              title="Copy token"
            >
              {copied ? (
                <Check size={17} className="text-green-400" />
              ) : (
                <Copy size={17} />
              )}
            </button>

          </div>

        </div>

        <p className="mb-5 text-xs text-slate-400">
          DNS changes may take some time to propagate. Once the
          record is available, click Verify Domain.
        </p>

        <button
          onClick={() =>
            handleVerifyDomain(selectedDomain.id)
          }
          disabled={
            verifyingId === selectedDomain.id ||
            !selectedDomain.verificationToken
          }
          className="w-full rounded-lg bg-blue-600 py-3 font-medium hover:bg-blue-500 disabled:opacity-50"
        >
          {verifyingId === selectedDomain.id
            ? "Verifying..."
            : "Verify Domain"}
        </button>

      </div>

    </div>

  )}

</div>


);
}

function StatCard({ title, value, icon }) {
return ( <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

  <div className="mb-4 flex items-center justify-between">

    <p className="text-sm text-slate-400">
      {title}
    </p>

    <div className="text-blue-400">
      {icon}
    </div>

  </div>

  <h3 className="text-3xl font-bold">
    {value}
  </h3>

</div>


);
}
