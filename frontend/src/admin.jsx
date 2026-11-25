import { useState } from "react";
import {
  FiFileText,
  FiGlobe,
  FiGrid,
  FiImage,
  FiInbox,
  FiLock,
  FiArrowRight,
  FiMenu,
  FiMusic,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiTrash2,
  FiUser,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { useStore, money } from "./store";
import { uploadFile } from "./api";
import { ThemeToggle } from "./theme";
import logo from "./image/logo.PNG";

const input =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20";
const btn =
  "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:bg-primary-soft";
const btn2 =
  "rounded-full border border-black/15 px-4 py-2 text-sm hover:border-primary dark:border-white/20";
const card =
  "rounded-2xl border border-black/10 bg-paper-raised p-4 dark:border-white/10 dark:bg-night-raised";

const Field = ({ label, children }) => (
  <label className="block text-xs text-neutral-500">
    {label}
    <div className="mt-1 text-neutral-900 dark:text-neutral-100">
      {children}
    </div>
  </label>
);

function UploadField({ label, accept, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      onDone(await uploadFile(f));
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
    e.target.value = "";
  };
  return (
    <div className="text-xs text-neutral-500">
      {label}
      <input
        type="file"
        accept={accept}
        onChange={pick}
        className="mt-1 block text-xs"
      />
      {busy && <span>Uploading…</span>}
      {err && <span className="text-red-600">{err}</span>}
    </div>
  );
}

async function createVideoPoster(file) {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = objectUrl;

  try {
    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Could not read a frame from this video.")), 15000);
      const cleanup = () => window.clearTimeout(timeout);
      video.addEventListener("error", () => { cleanup(); reject(new Error("Could not read a frame from this video.")); }, { once: true });
      video.addEventListener("loadedmetadata", () => {
        const seekTo = Number.isFinite(video.duration) ? Math.min(0.8, video.duration * 0.15) : 0;
        const ready = () => {
          if (video.readyState >= 2) { cleanup(); resolve(); }
          else video.addEventListener("loadeddata", () => { cleanup(); resolve(); }, { once: true });
        };
        if (seekTo > 0.05) {
          video.addEventListener("seeked", ready, { once: true });
          video.currentTime = seekTo;
        } else {
          ready();
        }
      }, { once: true });
      video.load();
    });

    if (!video.videoWidth || !video.videoHeight) throw new Error("This video has no readable preview frame.");
    const scale = Math.min(1, 1280 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
    if (!blob) throw new Error("Could not create a cover image from this video.");
    const filename = file.name.replace(/\.[^.]+$/, "") || "video-cover";
    return new File([blob], `${filename}-cover.jpg`, { type: "image/jpeg" });
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

function VideoUploadField({ label, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (event) => {
    const inputElement = event.currentTarget;
    const file = inputElement.files[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      let posterFile = null;
      let posterError = "";
      try {
        posterFile = await createVideoPoster(file);
      } catch (error) {
        posterError = error.message;
      }

      const src = await uploadFile(file);
      let poster = "";
      if (posterFile) {
        try {
          poster = await uploadFile(posterFile);
        } catch {
          posterError = "The cover image could not be saved.";
        }
      }
      onDone({ src, poster });
      if (posterError) setErr(`${posterError} You can still add a poster image below.`);
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
      inputElement.value = "";
    }
  };

  return (
    <div className="text-xs text-neutral-500">
      {label}
      <input type="file" accept="video/mp4,video/webm" onChange={pick} disabled={busy} className="mt-1 block text-xs disabled:opacity-60" />
      {busy && <span role="status" className="mt-1 block">Uploading video and generating cover…</span>}
      {err && <span role="status" className="mt-1 block text-amber-700 dark:text-amber-300">{err}</span>}
    </div>
  );
}

function ImageField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {value && (
          <img src={value} alt="" className="h-14 w-12 rounded object-cover" />
        )}
        <div className="flex-1 space-y-1">
          <input
            className={input}
            placeholder="Image URL"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
          <UploadField
            label=""
            accept="image/jpeg,image/png,image/webp,image/gif"
            onDone={onChange}
          />
        </div>
      </div>
    </Field>
  );
}

function Login() {
  const { login } = useStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await login(email, pw);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };
  return (
    <main className="grid min-h-svh place-items-center overflow-hidden bg-[#111113] px-5 py-10 text-white">
      <form
        onSubmit={submit}
        className="relative isolate w-full max-w-md overflow-hidden rounded-[2rem] border border-white/25 bg-white/[0.035] px-6 py-10 shadow-[0_28px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:px-10 sm:py-12"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-12 -top-12 -z-10 h-44 w-56 rounded-full bg-rose-400/40 blur-[65px]"
        />
        <div className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-white/[0.06] via-transparent to-black/30" />

        <header className="mb-8 text-center">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-200/75">
            Admin access
          </p>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Sign in to your admin dashboard
          </p>
        </header>

        <div className="space-y-4">
          <label
            htmlFor="admin-email"
            className="block rounded-full border border-white/20 bg-transparent px-6 py-3 transition focus-within:bg-transparent"
          >
            <span className="block text-xs text-white/45">Email</span>
            <input
              id="admin-email"
              type="email"
              autoFocus
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
          </label>

          <div className="relative rounded-full border border-white/15 bg-transparent px-6 py-3 transition focus-within:border-white/35 focus-within:bg-transparent">
            <label
              htmlFor="admin-password"
              className="block text-xs text-white/45"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Enter your password"
              className="mt-1 w-full bg-transparent pr-12 text-sm text-white outline-none placeholder:text-white/25"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label={busy ? "Signing in" : "Sign in"}
              title={busy ? "Signing in" : "Sign in"}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500 text-[#171214] shadow-[0_0_24px_rgba(245,158,11,0.48)] transition hover:scale-105 hover:bg-amber-400 disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? (
                <span className="text-xs">…</span>
              ) : (
                <FiArrowRight aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {err && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200"
          >
            {err}
          </p>
        )}

        <div
          className="my-8 flex items-center gap-4 text-xs text-white/35"
          aria-hidden="true"
        >
          <span className="h-px flex-1 bg-white/15" />
          <span>ADMIN ACCOUNT</span>
          <span className="h-px flex-1 bg-white/15" />
        </div>
        <p className="text-center text-xs leading-5 text-white/40">
          Use the email and password configured for your studio administrator.
        </p>
      </form>
    </main>
  );
}

function PasswordAdmin() {
  const { changePassword, logout } = useStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSaved(false);
    if (newPassword !== confirmPassword) {
      setErr("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
      window.setTimeout(logout, 900);
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${card} max-w-lg space-y-4`}>
      <div>
        <h2 className="font-medium">Change admin password</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Enter your current password, then choose a new one with at least 10
          characters.
        </p>
      </div>
      <Field label="Current password">
        <input
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          className={input}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </Field>
      <Field label="New password">
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={200}
          className={input}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Field>
      <Field label="Confirm new password">
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={200}
          className={input}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </Field>
      {err && (
        <p role="alert" className="text-sm text-red-600">
          {err}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Password changed. You will be signed out; use the new password to sign
          in.
        </p>
      )}
      <button disabled={busy} className={`${btn} disabled:opacity-60`}>
        {busy ? "Changing password…" : "Change password"}
      </button>
    </form>
  );
}

/* ---------- Overview ---------- */
function Overview() {
  const { orders, works, messages } = useStore();
  const revenue = orders.filter((o) => o.paid).reduce((n, o) => n + o.total, 0);
  const stats = [
    ["Revenue", money(revenue)],
    ["Orders", orders.length],
    [
      "Available works",
      works.filter((w) => w.collection === "sale" && w.status === "available")
        .length,
    ],
    ["Unread messages", messages.filter((m) => !m.read).length],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className={card}>
            <p className="text-xs text-neutral-500">{l}</p>
            <p className="mt-1 text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className={card}>
        <h3 className="font-medium">Recent orders</h3>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No orders yet. They'll show up here after checkout.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-black/10 text-sm dark:divide-white/10">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex justify-between py-2">
                <span>
                  {o.ref}, {o.customer.name}
                </span>
                <span>
                  {money(o.total)}, {o.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Artworks ---------- */
const blankWork = () => ({
  title: "",
  medium: "",
  size: "",
  year: new Date().getFullYear(),
  price: 0,
  printPrice: 0,
  status: "available",
  collection: "sale",
  image: "",
});

function Artworks() {
  const { works, saveWork, removeWork } = useStore();
  const [edit, setEdit] = useState(null);
  const [filter, setFilter] = useState("sale");
  const set = (k) => (e) =>
    setEdit({ ...edit, [k]: e.target ? e.target.value : e });
  const save = async (e) => {
    e.preventDefault();
    if (
      await saveWork({
        ...edit,
        price: Number(edit.price),
        printPrice: Number(edit.printPrice),
        year: Number(edit.year),
      })
    )
      setEdit(null);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[
            ["sale", "For sale"],
            ["archive", "Archive"],
          ].map(([id, l]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={filter === id ? btn : btn2}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          className={btn}
          onClick={() => setEdit({ ...blankWork(), collection: filter })}
        >
          Add artwork
        </button>
      </div>
      {edit && (
        <form onSubmit={save} className={`${card} grid gap-3 sm:grid-cols-2`}>
          <Field label="Title">
            <input
              required
              className={input}
              value={edit.title}
              onChange={set("title")}
            />
          </Field>
          <Field label="Medium">
            <input
              className={input}
              value={edit.medium}
              onChange={set("medium")}
            />
          </Field>
          <Field label="Size">
            <input
              className={input}
              value={edit.size || ""}
              onChange={set("size")}
              placeholder="60 x 80 cm"
            />
          </Field>
          <Field label="Year">
            <input
              type="number"
              className={input}
              value={edit.year || ""}
              onChange={set("year")}
            />
          </Field>
          <Field label="Collection">
            <select
              className={input}
              value={edit.collection}
              onChange={set("collection")}
            >
              <option value="sale">For sale</option>
              <option value="archive">Archive</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              className={input}
              value={edit.status || "available"}
              onChange={set("status")}
            >
              <option>available</option>
              <option>reserved</option>
              <option>sold</option>
            </select>
          </Field>
          <Field label="Original price (NGN)">
            <input
              type="number"
              min="0"
              className={input}
              value={edit.price}
              onChange={set("price")}
            />
          </Field>
          <Field label="Print price (NGN, 0 for none)">
            <input
              type="number"
              min="0"
              className={input}
              value={edit.printPrice}
              onChange={set("printPrice")}
            />
          </Field>
          <div className="sm:col-span-2">
            <ImageField
              label="Image"
              value={edit.image}
              onChange={set("image")}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button className={btn}>Save artwork</button>
            <button
              type="button"
              className={btn2}
              onClick={() => setEdit(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <ul className="space-y-2">
        {works
          .filter((w) => w.collection === filter)
          .map((w) => (
            <li key={w.id} className={`${card} flex items-center gap-3 !p-3`}>
              {w.image ? (
                <img
                  src={w.image}
                  alt=""
                  className="h-14 w-12 rounded object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="h-14 w-12 rounded bg-neutral-200 dark:bg-night"
                />
              )}
              <div className="flex-1 text-sm">
                <p className="font-medium">{w.title}</p>
                <p className="text-neutral-500">
                  {w.collection === "sale"
                    ? `${money(w.price)}, ${w.status}`
                    : w.year}
                </p>
              </div>
              <button
                className="text-sm hover:text-primary"
                onClick={() => setEdit(w)}
              >
                Edit
              </button>
              <button
                className="text-sm text-red-600"
                onClick={() =>
                  confirm(`Delete "${w.title}"?`) && removeWork(w.id)
                }
              >
                Delete
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

/* ---------- Orders ---------- */
function Orders() {
  const { orders, updateOrder } = useStore();
  if (!orders.length)
    return (
      <p className="text-sm text-neutral-500">
        No orders yet. They'll show up here after checkout.
      </p>
    );
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id} className={`${card} text-sm`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{o.ref}</p>
              <p className="text-neutral-500">
                {new Date(o.createdAt).toLocaleString("en-NG")}
              </p>
            </div>
            <select
              aria-label="Order status"
              value={o.status}
              onChange={(e) => updateOrder(o.id, { status: e.target.value })}
              className="rounded-lg border border-black/15 bg-transparent px-2 py-1 dark:border-white/20"
            >
              {["pending", "paid", "shipped", "delivered", "cancelled"].map(
                (s) => (
                  <option key={s} className="text-black">
                    {s}
                  </option>
                ),
              )}
            </select>
          </div>
          <p className="mt-2">
            {o.customer.name}, {o.customer.phone},{" "}
            <a className="underline" href={`mailto:${o.customer.email}`}>
              {o.customer.email}
            </a>
          </p>
          <p className="text-neutral-500">
            {o.customer.address}
            {o.customer.note ? `. Note: ${o.customer.note}` : ""}
          </p>
          <ul className="mt-2 text-neutral-600 dark:text-neutral-300">
            {o.items.map((i, n) => (
              <li key={n}>
                {i.title}, {i.option} x{i.qty}, {money(i.price * i.qty)}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-medium">
            Total {money(o.total)} ({o.paid ? "paid" : "awaiting payment"})
          </p>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Music ---------- */
function MusicAdmin() {
  const { tracks, saveTrack, removeTrack } = useStore();
  const [edit, setEdit] = useState(null);
  const set = (k) => (e) =>
    setEdit({ ...edit, [k]: e.target ? e.target.value : e });
  return (
    <div className="space-y-4">
      <button
        className={`${btn} inline-flex items-center gap-2`}
        onClick={() =>
          setEdit({ title: "", meta: "", length: "", src: "", cover: "", description: "" })
        }
      >
        <span aria-hidden="true" className="admin-plus-shake">
          <FiPlus />
        </span>
        Add track
      </button>
      {edit && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await saveTrack(edit)) setEdit(null);
          }}
          className={`${card} grid gap-3 sm:grid-cols-2`}
        >
          <Field label="Title">
            <input
              required
              className={input}
              value={edit.title}
              onChange={set("title")}
            />
          </Field>
          <Field label="Release info">
            <input
              className={input}
              value={edit.meta}
              onChange={set("meta")}
              placeholder="Single, 2026"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                rows="3"
                maxLength={3000}
                className={input}
                value={edit.description || ""}
                onChange={set("description")}
                placeholder="Tell listeners about this track"
              />
            </Field>
          </div>
          <Field label="Length">
            <input
              className={input}
              value={edit.length}
              onChange={set("length")}
              placeholder="3:42"
            />
          </Field>
          <div className="space-y-2">
            <Field label="Audio URL (mp3)">
              <input className={input} value={edit.src} onChange={set("src")} />
            </Field>
            <UploadField
              label="Or upload an mp3"
              accept="audio/mpeg"
              onDone={(u) => set("src")(u)}
            />
          </div>
          <div className="sm:col-span-2">
            <ImageField
              label="Cover"
              value={edit.cover}
              onChange={set("cover")}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button className={btn}>Save track</button>
            <button
              type="button"
              className={btn2}
              onClick={() => setEdit(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <ul className="space-y-2">
        {tracks.map((t) => (
          <li key={t.id} className={`${card} flex items-center gap-3 !p-3`}>
            {t.cover ? (
              <img
                src={t.cover}
                alt=""
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-12 w-12 rounded bg-neutral-200 dark:bg-night"
              />
            )}
            <div className="flex-1 text-sm">
              <p className="font-medium">{t.title}</p>
              <p className="text-neutral-500">
                {t.meta}, {t.length}
              </p>
            </div>
            <button
              className="text-sm hover:text-primary"
              onClick={() => setEdit(t)}
            >
              Edit
            </button>
            <button
              className="text-sm text-red-600"
              onClick={() =>
                confirm(`Delete "${t.title}"?`) && removeTrack(t.id)
              }
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Site settings ---------- */
function SettingsAdmin() {
  const { settings, saveSettings } = useStore();
  const [s, setS] = useState(settings);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => {
    setSaved(false);
    setS({ ...s, [k]: e.target ? e.target.value : e });
  };
  const heroImages = s.heroImages || [];
  const setHeroImage = (index, url) => {
    setSaved(false);
    setS((current) => ({
      ...current,
      heroImages: (current.heroImages || []).map((image, i) =>
        i === index ? url : image,
      ),
    }));
  };
  const addHeroImage = () => {
    if (heroImages.length >= 9) return;
    setSaved(false);
    setS((current) => ({
      ...current,
      heroImages: [...(current.heroImages || []), ""],
    }));
  };
  const removeHeroImage = (index) => {
    setSaved(false);
    setS((current) => ({
      ...current,
      heroImages: (current.heroImages || []).filter((_, i) => i !== index),
    }));
  };
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await saveSettings({
            ...s,
            shippingFee: Number(s.shippingFee),
            spotify: (s.spotify || "").trim(),
            appleMusic: (s.appleMusic || "").trim(),
            youtube: (s.youtube || "").trim(),
            heroImages: (s.heroImages || [])
              .map((u) => u.trim())
              .filter(Boolean)
              .slice(0, 9),
          })
        )
          setSaved(true);
      }}
      className={`${card} grid gap-3 sm:grid-cols-2`}
    >
      <Field label="Artist name">
        <input className={input} value={s.name} onChange={set("name")} />
      </Field>
      <Field label="Location">
        <input
          className={input}
          value={s.location}
          onChange={set("location")}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Hero headline (separate the three lines with | )">
          <input
            className={input}
            value={s.headline}
            onChange={set("headline")}
          />
        </Field>
      </div>
      <Field label="Contact email">
        <input
          type="email"
          className={input}
          value={s.email}
          onChange={set("email")}
        />
      </Field>
      <Field label="Flat shipping fee (NGN)">
        <input
          type="number"
          min="0"
          className={input}
          value={s.shippingFee}
          onChange={set("shippingFee")}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Bio">
          <textarea
            rows="4"
            className={input}
            value={s.bio}
            onChange={set("bio")}
          />
        </Field>
      </div>
      <div className="space-y-3 sm:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs text-neutral-500">Hero slider images</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Paste an image link or upload a photo. Slides change every 6
              seconds; up to 9 images.
            </p>
          </div>
          <button
            type="button"
            onClick={addHeroImage}
            disabled={heroImages.length >= 9}
            aria-label="Add hero slide"
            title="Add hero slide"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-lg hover:border-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20"
          >
            <FiPlus />
          </button>
        </div>
        <div className="space-y-3">
          {heroImages.map((url, index) => (
            <div
              key={index}
              className={`${card} grid gap-3 !p-3 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center`}
            >
              {url ? (
                <img
                  src={url}
                  alt={`Hero slide ${index + 1} preview`}
                  className="h-20 w-20 rounded-lg bg-neutral-200 object-cover dark:bg-night"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-lg bg-neutral-100 text-xs text-neutral-400 dark:bg-night">
                  Slide {index + 1}
                </div>
              )}
              <div className="min-w-0 space-y-2">
                <Field label={`Slide ${index + 1} image link`}>
                  <input
                    className={input}
                    value={url || ""}
                    onChange={(e) => setHeroImage(index, e.target.value)}
                    placeholder="Paste an image URL"
                  />
                </Field>
                <UploadField
                  label="Or upload an image file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onDone={(uploadedUrl) => setHeroImage(index, uploadedUrl)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeHeroImage(index)}
                aria-label={`Remove hero slide ${index + 1}`}
                title="Remove slide"
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-red-600 hover:bg-red-500/10 sm:justify-self-end"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
          {heroImages.length === 0 && (
            <p className="rounded-xl border border-dashed border-black/20 p-4 text-sm text-neutral-500 dark:border-white/20">
              No hero slides yet. Add a direct image link or upload a photo; a
              neutral placeholder will show until then.
            </p>
          )}
        </div>
      </div>
      <ImageField
        label="About image"
        value={s.aboutImage}
        onChange={set("aboutImage")}
      />
      <Field label="Instagram link">
        <input
          className={input}
          value={s.instagram}
          onChange={set("instagram")}
        />
      </Field>
      <Field label="Facebook link">
        <input
          className={input}
          value={s.facebook}
          onChange={set("facebook")}
        />
      </Field>
      <Field label="WhatsApp link (https://wa.me/234...)">
        <input
          className={input}
          value={s.whatsapp}
          onChange={set("whatsapp")}
        />
      </Field>
      <Field label="Twitter link">
        <input className={input} value={s.twitter} onChange={set("twitter")} />
      </Field>
      <div className="space-y-3 border-t border-black/10 pt-4 dark:border-white/10 sm:col-span-2">
        <div>
          <h3 className="text-sm font-semibold">Music app links</h3>
          <p className="mt-1 text-xs text-neutral-500">Add your artist, album, or channel links. These appear beside the music player.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Spotify link">
            <input type="url" className={input} value={s.spotify || ""} onChange={set("spotify")} placeholder="https://open.spotify.com/..." />
          </Field>
          <Field label="Apple Music link">
            <input type="url" className={input} value={s.appleMusic || ""} onChange={set("appleMusic")} placeholder="https://music.apple.com/..." />
          </Field>
          <Field label="YouTube link">
            <input type="url" className={input} value={s.youtube || ""} onChange={set("youtube")} placeholder="https://youtube.com/..." />
          </Field>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className={btn}>Save settings</button>
        {saved && <span className="text-sm text-neutral-500">Saved</span>}
      </div>
    </form>
  );
}

/* ---------- Live videos ---------- */
const today = () => new Date().toISOString().slice(0, 10);

function VideosAdmin() {
  const { videos, saveVideo, removeVideo } = useStore();
  const [edit, setEdit] = useState(null);
  const set = (k) => (e) =>
    setEdit({ ...edit, [k]: e.target ? e.target.value : e });
  return (
    <div className="space-y-4">
      <button
        className={`${btn} inline-flex items-center gap-2`}
        onClick={() =>
          setEdit({
            title: "",
            date: today(),
            src: "",
            poster: "",
            description: "",
            story: "",
          })
        }
      >
        <span aria-hidden="true" className="admin-plus-shake">
          <FiPlus />
        </span>
        Add video
      </button>
      {edit && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await saveVideo(edit)) setEdit(null);
          }}
          className={`${card} grid gap-3 sm:grid-cols-2`}
        >
          <Field label="Title">
            <input
              required
              className={input}
              value={edit.title}
              onChange={set("title")}
            />
          </Field>
          <Field label="Date uploaded">
            <input
              type="date"
              required
              className={input}
              value={edit.date}
              onChange={set("date")}
            />
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <Field label="Video link (mp4 URL, YouTube or Vimeo)">
              <input
                required
                className={input}
                value={edit.src}
                onChange={set("src")}
                placeholder="https://"
              />
            </Field>
            <VideoUploadField
              label="Or upload a video file (mp4 or webm, up to 200 MB). A cover preview is generated automatically."
              onDone={({ src, poster }) => setEdit((current) => ({ ...current, src, ...(poster ? { poster } : {}) }))}
            />
          </div>
          <div className="sm:col-span-2">
            <ImageField
              label="Poster image"
              value={edit.poster}
              onChange={set("poster")}
            />
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                rows="3"
                className={input}
                value={edit.description}
                onChange={set("description")}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="The story behind it">
              <textarea
                rows="4"
                className={input}
                value={edit.story}
                onChange={set("story")}
              />
            </Field>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button className={btn}>Save video</button>
            <button
              type="button"
              className={btn2}
              onClick={() => setEdit(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <ul className="space-y-2">
        {[...videos]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((v) => (
            <li key={v.id} className={`${card} flex items-center gap-3 !p-3`}>
              {v.poster && (
                <img
                  src={v.poster}
                  alt=""
                  className="h-12 w-20 rounded object-cover"
                />
              )}
              <div className="flex-1 text-sm">
                <p className="font-medium">{v.title}</p>
                <p className="text-neutral-500">
                  {v.date}, {v.likes || 0} likes, {v.loves || 0} loves
                </p>
              </div>
              <button
                className="text-sm hover:text-primary"
                onClick={() => setEdit(v)}
              >
                Edit
              </button>
              <button
                className="text-sm text-red-600"
                onClick={() =>
                  confirm(`Delete "${v.title}"?`) && removeVideo(v.id)
                }
              >
                Delete
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

/* ---------- Blog ---------- */
function BlogAdmin() {
  const { posts, savePost, removePost } = useStore();
  const [edit, setEdit] = useState(null);
  const set = (k) => (e) =>
    setEdit({ ...edit, [k]: e.target ? e.target.value : e });
  return (
    <div className="space-y-4">
      <button
        className={btn}
        onClick={() =>
          setEdit({
            title: "",
            caption: "",
            cover: "",
            date: today(),
            body: "",
          })
        }
      >
        New post
      </button>
      {edit && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await savePost({
                ...edit,
                updatedAt: edit.id ? new Date().toISOString() : null,
              })
            )
              setEdit(null);
          }}
          className={`${card} grid gap-3`}
        >
          <Field label="Title">
            <input
              required
              className={input}
              value={edit.title}
              onChange={set("title")}
            />
          </Field>
          <Field label="Caption (short summary shown on the blog list)">
            <input
              className={input}
              value={edit.caption}
              onChange={set("caption")}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              required
              className={input}
              value={edit.date}
              onChange={set("date")}
            />
          </Field>
          <ImageField
            label="Cover image"
            value={edit.cover}
            onChange={set("cover")}
          />
          <Field label="Full description (blank line between paragraphs)">
            <textarea
              required
              rows="12"
              className={input}
              value={edit.body}
              onChange={set("body")}
            />
          </Field>
          <div className="flex gap-2">
            <button className={btn}>
              {edit.id ? "Update post" : "Publish post"}
            </button>
            <button
              type="button"
              className={btn2}
              onClick={() => setEdit(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <ul className="space-y-2">
        {[...posts]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((p) => (
            <li key={p.id} className={`${card} flex items-center gap-3 !p-3`}>
              {p.cover && (
                <img
                  src={p.cover}
                  alt=""
                  className="h-12 w-20 rounded object-cover"
                />
              )}
              <div className="flex-1 text-sm">
                <p className="font-medium">{p.title}</p>
                <p className="text-neutral-500">
                  {p.date}
                  {p.updatedAt ? ", edited" : ""}
                </p>
              </div>
              <button
                className="text-sm hover:text-primary"
                onClick={() => setEdit(p)}
              >
                Edit
              </button>
              <button
                className="text-sm text-red-600"
                onClick={() =>
                  confirm(`Delete "${p.title}"?`) && removePost(p.id)
                }
              >
                Delete
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

/* ---------- Inbox: contact messages and video comments ---------- */
function Inbox() {
  const { messages, markMessage, removeMessage } = useStore();
  if (!messages.length)
    return (
      <p className="text-sm text-neutral-500">
        No messages yet. Contact form messages and video comments will appear
        here.
      </p>
    );
  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li
          key={m.id}
          className={`${card} text-sm ${m.read ? "opacity-70" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {m.name}
              {m.email ? `, ${m.email}` : ""}
            </p>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">
              {m.type === "comment"
                ? `Comment on "${m.videoTitle}"`
                : "Contact form"}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-line">{m.message}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
            <span>{new Date(m.createdAt).toLocaleString("en-NG")}</span>
            <button
              className="underline"
              onClick={() => markMessage(m.id, !m.read)}
            >
              {m.read ? "Mark unread" : "Mark read"}
            </button>
            {m.email && (
              <a className="underline" href={`mailto:${m.email}`}>
                Reply
              </a>
            )}
            <button
              className="text-red-600 underline"
              onClick={() => removeMessage(m.id)}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

const tabs = [
  {
    id: "overview",
    label: "Overview",
    description: "See studio activity and recent updates.",
    Icon: FiGrid,
    Component: Overview,
  },
  {
    id: "artworks",
    label: "Artworks",
    description: "Add, edit, and organize artwork.",
    Icon: FiImage,
    Component: Artworks,
  },
  {
    id: "orders",
    label: "Orders",
    description: "Review purchases and update order status.",
    Icon: FiShoppingBag,
    Component: Orders,
  },
  {
    id: "videos",
    label: "Videos",
    description: "Manage featured videos and comments.",
    Icon: FiVideo,
    Component: VideosAdmin,
  },
  {
    id: "blog",
    label: "Blog",
    description: "Write and manage studio posts.",
    Icon: FiFileText,
    Component: BlogAdmin,
  },
  {
    id: "inbox",
    label: "Inbox",
    description: "Read and manage visitor messages.",
    Icon: FiInbox,
    Component: Inbox,
  },
  {
    id: "music",
    label: "Music",
    description: "Manage music tracks and links.",
    Icon: FiMusic,
    Component: MusicAdmin,
  },
  {
    id: "settings",
    label: "Site",
    description: "Edit site details, images, and social links.",
    Icon: FiSettings,
    Component: SettingsAdmin,
  },
  {
    id: "password",
    label: "Password",
    description: "Change the admin password.",
    Icon: FiLock,
    Component: PasswordAdmin,
  },
];

function AdminSidebar({
  activeTab,
  onSelect,
  settings,
  search,
  setSearch,
  onClose,
  onHoverDescription,
  onLogout,
}) {
  const query = search.trim().toLowerCase();
  const matches = (item) =>
    `${item.label} ${item.description}`.toLowerCase().includes(query);
  const primaryTabs = tabs.slice(0, 7).filter(matches);
  const otherTabs = tabs.slice(7).filter(matches);

  const renderTab = (item) => {
    const selected = activeTab === item.id;
    const Icon = item.Icon;
    return (
      <button
        key={item.id}
        type="button"
        title={item.description}
        aria-label={`${item.label}: ${item.description}`}
        aria-current={selected ? "page" : undefined}
        onClick={() => onSelect(item.id)}
        onMouseEnter={() => onHoverDescription(item.description)}
        onMouseLeave={() => onHoverDescription("")}
        onFocus={() => onHoverDescription(item.description)}
        onBlur={() => onHoverDescription("")}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition duration-200 ${selected ? "bg-gradient-to-r from-white/[0.09] via-white/[0.08] to-violet-700/35 text-white shadow-[inset_-18px_0_28px_rgba(91,33,182,0.24)]" : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"}`}
      >
        <Icon
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 ${selected ? "text-white" : "text-neutral-500 group-hover:text-neutral-200"}`}
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <span
          className={`absolute right-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.8)] transition-opacity ${selected ? "opacity-100" : "opacity-0"}`}
        />
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col px-4 py-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <a
          href="#top"
          onClick={() => {
            location.hash = "";
            onClose?.();
          }}
          className="flex min-w-0 items-center gap-3"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] p-1.5">
            <img src={logo} alt="" className="h-full w-full object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-wide">
              Admin Dashboard
            </span>
            <span className="mt-0.5 block truncate text-xs text-neutral-500">
              {settings.name}
            </span>
          </span>
        </a>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <FiX />
          </button>
        )}
      </div>

      <label className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-neutral-500 focus-within:border-violet-400/50 focus-within:text-neutral-300">
        <FiSearch aria-hidden="true" className="shrink-0" />
        <span className="sr-only">Search admin sections</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search sections..."
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
        />
      </label>

      <nav
        className="mt-6 flex-1 space-y-5 overflow-y-auto pb-3"
        aria-label="Admin dashboard"
      >
        {primaryTabs.length > 0 && (
          <div className="space-y-1">
            {!query && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                Workspace
              </p>
            )}
            {primaryTabs.map(renderTab)}
          </div>
        )}
        {otherTabs.length > 0 && (
          <div className="space-y-1 border-t border-white/10 pt-4">
            {!query && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                Other
              </p>
            )}
            {otherTabs.map(renderTab)}
          </div>
        )}
        {primaryTabs.length === 0 && otherTabs.length === 0 && (
          <p className="px-3 py-4 text-sm text-neutral-500">
            No matching section.
          </p>
        )}
      </nav>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Studio workspace
        </p>
        <p className="mt-1 truncate text-sm font-medium text-neutral-200">
          {settings.name}
        </p>
        <p className="mt-1 text-xs leading-4 text-neutral-500">
          Manage artwork, orders, and site content.
        </p>
      </div>

      <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
        <a
          href="#top"
          onClick={() => {
            location.hash = "";
            onClose?.();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <FiGlobe aria-hidden="true" className="h-5 w-5 text-neutral-500" />
          <span>View site</span>
        </a>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <span
            aria-hidden="true"
            className="flex items-center text-neutral-500"
          >
            <FiUser className="h-5 w-5" />
            <FiArrowRight className="-ml-1 h-3.5 w-3.5" />
          </span>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const { isAdmin, logout, adminLoading, adminError, refreshAdmin, settings } =
    useStore();
  const [tab, setTab] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredDescription, setHoveredDescription] = useState("");
  if (!isAdmin) return <Login />;
  const activeItem = tabs.find((item) => item.id === tab) || tabs[0];
  const Active = activeItem.Component;
  const chooseTab = (id) => {
    setTab(id);
    setMenuOpen(false);
    setHoveredDescription("");
  };
  const sidebarProps = {
    activeTab: tab,
    onSelect: chooseTab,
    settings,
    search,
    setSearch,
    onHoverDescription: setHoveredDescription,
    onLogout: logout,
  };
  return (
    <div className="min-h-svh bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/[0.07] bg-[#151515] lg:flex">
        <AdminSidebar {...sidebarProps} />
      </aside>

      <main className="min-h-svh min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open admin navigation"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-xl transition hover:border-violet-500 lg:hidden dark:border-white/10"
              >
                <FiMenu />
              </button>
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-neutral-500">
                  Admin Dashboard
                </p>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {activeItem.label}
                </h1>
                <p className="mt-1 min-h-4 text-xs text-neutral-500">
                  {hoveredDescription || activeItem.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </header>
          <div className="mt-6">
            {adminLoading && (
              <p role="status" className="mb-4 text-sm text-neutral-500">
                Refreshing admin data…
              </p>
            )}
            {adminError && (
              <div
                role="alert"
                className={`${card} mb-4 flex flex-wrap items-center justify-between gap-3 text-sm`}
              >
                <span>Could not load admin data: {adminError}</span>
                <button onClick={refreshAdmin} className={btn2}>
                  Try again
                </button>
              </div>
            )}
            <Active />
          </div>
        </div>
      </main>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="relative z-10 h-full w-72 max-w-[88vw] bg-[#151515] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <AdminSidebar
              {...sidebarProps}
              onClose={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
