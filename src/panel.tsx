import type OBR from "@owlbear-rodeo/sdk";
import type { Theme as OBRTheme } from "@owlbear-rodeo/sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import SvgIcon from "@mui/material/SvgIcon";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ID, SHARE_KEY, defaults, MIN_SIZE, MAX_SIZE, portraitFrom, settingsFrom, type Settings } from "./model";
import { createPortraitBinding } from "./binding";
import { PANEL_HEIGHT, PREF_COMMAND, PREF_REQUEST, PREF_STATE } from "./context-ui";

type Binding = Awaited<ReturnType<typeof createPortraitBinding>>;
function Icon({ kind }: { kind: "image" | "save" | "clear" }) {
  const paths = {
    image: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2ZM8.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM5 18l4-5 3 4 3-6 4 7H5Z",
    save: "m9 16.2-4.2-4.2-1.4 1.4L9 19l12-12-1.4-1.4Z",
    clear: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z",
  };
  return <SvgIcon fontSize="small"><path d={paths[kind]} /></SvgIcon>;
}
function initialSettings() {
  try { return settingsFrom(JSON.parse(localStorage.getItem(ID) ?? "null")); } catch { return { ...defaults }; }
}
function Panel({ api }: { api: typeof OBR }) {
  const [settings, setSettings] = useState(initialSettings);
  const settingsRef = useRef(settings);
  const [sizeText, setSizeText] = useState(String(settings.size));
  const [sliderSize, setSliderSize] = useState(settings.size);
  const [hostTheme, setHostTheme] = useState<OBRTheme>();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState("PLAYER");
  const [sharing, setSharing] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const binding = useRef<Binding | undefined>(undefined);
  const disposed = useRef(false);
  const preferenceRevision = useRef(0);
  const [count, setCount] = useState(0);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("กำลังอ่าน Token…");
  const theme = useMemo(() => createTheme({
    palette: {
      mode: hostTheme?.mode === "LIGHT" ? "light" : "dark",
      primary: hostTheme?.primary ?? { main: "#bb99ff" },
      secondary: hostTheme?.secondary ?? { main: "#bb99ff" },
      ...(hostTheme ? { text: hostTheme.text } : {}),
      background: { default: "transparent", paper: hostTheme?.background.paper ?? "#3d4051" },
    },
    shape: { borderRadius: 12 },
    typography: { fontFamily: "Roboto, Arial, Tahoma, sans-serif", fontSize: 13 },
    components: {
      MuiButtonBase: { defaultProps: { disableRipple: true } },
      MuiButton: { styleOverrides: { root: { textTransform: "none", minHeight: 32 } } },
      MuiFormControlLabel: { styleOverrides: { label: { fontSize: 13 } } },
      MuiInputBase: { styleOverrides: { input: { fontSize: 13 } } },
      MuiMenuItem: { styleOverrides: { root: { fontSize: 13, minHeight: 32 } } },
    },
  }), [hostTheme]);
  function reflect(value: unknown) {
    const next = settingsFrom(value);
    settingsRef.current = next;
    setSettings(next); setSizeText(String(next.size)); setSliderSize(next.size);
  }
  async function savePreferences(patch: Partial<Settings>) {
    const previous = settingsRef.current;
    const next = settingsFrom({ ...previous, ...patch });
    const revision = ++preferenceRevision.current;
    reflect(next);
    try {
      await api.broadcast.sendMessage(PREF_COMMAND, next, { destination: "LOCAL" });
      if (revision === preferenceRevision.current) {
        try { localStorage.setItem(ID, JSON.stringify(next)); } catch {}
      }
    } catch {
      if (!disposed.current && revision === preferenceRevision.current) { reflect(previous); setStatus("บันทึกการตั้งค่าไม่สำเร็จ"); }
    }
  }
  useEffect(() => {
    disposed.current = false;
    const cleanups: (() => void)[] = [];
    let playerRevision = 0;
    const reflectPlayer = (value: { role: string; metadata: Record<string, unknown> }) => {
      if (disposed.current) return;
      setRole(value.role); setSharing(value.role === "GM" && value.metadata[SHARE_KEY] === true);
    };
    api.onReady(async () => {
      if (disposed.current) return;
      try {
        cleanups.push(api.broadcast.onMessage(PREF_STATE, event => { if (!disposed.current) reflect(event.data); }));
        cleanups.push(api.player.onChange(player => { ++playerRevision; reflectPlayer(player); }));
        cleanups.push(api.theme.onChange(value => { if (!disposed.current) setHostTheme(value); }));
        const revision = playerRevision;
        const [playerRole, metadata, currentTheme] = await Promise.all([api.player.getRole(), api.player.getMetadata(), api.theme.getTheme()]);
        if (disposed.current) return;
        if (revision === playerRevision) reflectPlayer({ role: playerRole, metadata });
        setHostTheme(currentTheme); setReady(true);
        // Observe only the content root. MUI menus/tooltips portal into body and
        // must not enlarge the host embed or create a resize feedback loop.
        const content = document.querySelector<HTMLElement>("#root")!;
        let pending: ReturnType<typeof setTimeout> | undefined;
        let previousHeight = 0;
        const observer = new ResizeObserver(() => {
          clearTimeout(pending);
          pending = setTimeout(() => {
            if (disposed.current) return;
            const height = Math.ceil(content.getBoundingClientRect().height);
            if (height <= 0 || height === previousHeight) return;
            previousHeight = height;
            void api.broadcast.sendMessage(PANEL_HEIGHT, height, { destination: "LOCAL" }).catch(console.error);
          }, 50);
        });
        observer.observe(content);
        cleanups.push(() => { observer.disconnect(); clearTimeout(pending); });
        await api.broadcast.sendMessage(PREF_REQUEST, {}, { destination: "LOCAL" });
        const current = await createPortraitBinding(api);
        if (disposed.current) { current.dispose(); return; }
        binding.current = current; setCount(current.ids.length); setUrl(current.current?.url ?? "");
        setStatus(current.ids.length ? `ใช้กับ ${current.ids.length} Token ที่เลือก` : "กรุณาเลือก Token แล้วเปิด Portrait ใหม่");
      } catch { if (!disposed.current) setStatus("อ่านข้อมูลไม่สำเร็จ กรุณาเปิด Portrait ใหม่"); }
    });
    return () => { disposed.current = true; binding.current?.dispose(); cleanups.forEach(fn => fn()); };
  }, [api]);
  async function toggleSharing(value: boolean) {
    setShareBusy(true);
    try {
      if (await api.player.getRole() !== "GM") throw new Error("โหมดนี้ใช้ได้เฉพาะ DM");
      await api.player.setMetadata({ [SHARE_KEY]: value });
      if (!disposed.current) setStatus(value ? "แชร์ตาม Token ที่ DM เลือก · Token ที่ปิดตาจะไม่แสดง" : "หยุดแสดงให้ทุกคนแล้ว");
    } catch { if (!disposed.current) setStatus("เปลี่ยนโหมดแชร์ไม่สำเร็จ"); }
    finally {
      try {
        const [currentRole, metadata] = await Promise.all([api.player.getRole(), api.player.getMetadata()]);
        if (!disposed.current) { setRole(currentRole); setSharing(currentRole === "GM" && metadata[SHARE_KEY] === true); }
      } catch { if (!disposed.current) setStatus("อ่านสถานะการแชร์ไม่สำเร็จ กรุณาเปิด Portrait ใหม่"); }
      finally { if (!disposed.current) setShareBusy(false); }
    }
  }
  async function run(action: (value: Binding) => Promise<void>) {
    if (busyRef.current || !binding.current || disposed.current) return;
    busyRef.current = true; setBusy(true);
    try { await action(binding.current); }
    catch (error) { if (!disposed.current) setStatus(error instanceof Error ? error.message : "ทำรายการไม่สำเร็จ ตรวจสิทธิ์แก้ไข Token"); }
    finally { busyRef.current = false; if (!disposed.current) setBusy(false); }
  }
  async function saveUrl(value: Binding) {
    const link = new URL(url.trim());
    if (link.protocol !== "https:" || link.username || link.password) throw new Error("กรุณาใช้ลิงก์รูป HTTPS ที่ไม่มีข้อมูลเข้าสู่ระบบ");
    setStatus("กำลังตรวจรูปภาพ…");
    const image = new Image(); image.referrerPolicy = "no-referrer";
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { image.src = ""; reject(new Error("โหลดภาพนานเกินไป กรุณาตรวจลิงก์")); }, 12000);
      image.onload = () => { clearTimeout(timer); resolve(); };
      image.onerror = () => { clearTimeout(timer); reject(new Error("โหลดรูปไม่ได้ ใช้ลิงก์รูปโดยตรง")); };
      image.src = link.href;
    });
    const portrait = portraitFrom({ url: link.href, width: image.naturalWidth, height: image.naturalHeight });
    if (!portrait) throw new Error("ขนาดรูปภาพไม่ถูกต้อง");
    await value.save(portrait); await savePreferences({ enabled: true });
    if (!disposed.current) setStatus("บันทึกรูปแล้ว");
  }
  const commitSize = () => void savePreferences({ size: sizeText.trim() === "" ? settingsRef.current.size : Number(sizeText) });
  const artworkDisabled = !ready || busy || count === 0;
  return <ThemeProvider theme={theme}>
    <Stack spacing={0.75} sx={{ p: 1, color: "text.primary" }}>
      <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
        <FormControl size="small" fullWidth disabled={!ready}>
          <InputLabel id="side-label">ตำแหน่ง</InputLabel>
          <Select id="side" labelId="side-label" label="ตำแหน่ง" value={settings.side}
            onChange={event => void savePreferences({ side: event.target.value as Settings["side"] })}
            MenuProps={{ disableScrollLock: true, marginThreshold: 4, MenuListProps: { dense: true }, PaperProps: { sx: { borderRadius: 1 } } }}>
            <MenuItem value="left">ซ้ายล่าง</MenuItem><MenuItem value="right">ขวาล่าง</MenuItem>
          </Select>
        </FormControl>
        <TextField id="size" size="small" fullWidth label="ขนาด (px)" value={sizeText} disabled={!ready}
          slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": "ขนาด (พิกเซล)", style: { textAlign: "center" } } }}
          onChange={event => setSizeText(event.target.value)} onBlur={commitSize}
          onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commitSize(); } }} />
      </Stack>
      <Box sx={{ px: 1 }}><Slider id="size-range" size="small" min={MIN_SIZE} max={MAX_SIZE} step={1} value={sliderSize} disabled={!ready}
        aria-label="เลื่อนปรับขนาด" valueLabelDisplay="auto" sx={{ display: "block", py: 1 }}
        onChange={(_, value) => { const size = value as number; setSliderSize(size); setSizeText(String(size)); }}
        onChangeCommitted={(_, value) => void savePreferences({ size: value as number })} /></Box>
      <FormControlLabel sx={{ m: 0, minHeight: 28 }} control={<Switch id="enabled" size="small" checked={settings.enabled} disabled={!ready}
        onChange={(_, value) => void savePreferences({ enabled: value })} />} label="แสดงภาพ Portrait" />
      {role === "GM" && <FormControlLabel id="share-row" sx={{ m: 0, minHeight: 28 }} control={<Switch id="share" size="small" checked={sharing} disabled={!ready || shareBusy}
        onChange={(_, value) => void toggleSharing(value)} />} label="แสดงให้ทุกคนเห็น · DM" />}
      <Divider />
      <Button id="choose" size="small" color="inherit" fullWidth disabled={artworkDisabled} startIcon={<Icon kind="image" />}
        onClick={() => void run(async value => {
          if (await value.choose()) { if (disposed.current) return; setUrl(value.current?.url ?? ""); await savePreferences({ enabled: true }); setStatus("ผูกรูปจากคลังแล้ว"); }
          else if (!disposed.current) setStatus("ยกเลิกการเลือกรูป");
        })}>เลือกรูปจากคลัง Owlbear</Button>
      <Stack component="form" id="url-form" direction="row" spacing={0.5} alignItems="center" sx={{ pt: 0.5 }}
        onSubmit={event => { event.preventDefault(); void run(saveUrl); }}>
        <TextField id="url" label="ลิงก์รูปภาพ HTTPS" placeholder="https://…/portrait.png" size="small" fullWidth required disabled={artworkDisabled}
          value={url} onChange={event => setUrl(event.target.value)} slotProps={{ htmlInput: { "aria-label": "ลิงก์รูปภาพ HTTPS" } }} />
        <Tooltip title="บันทึกลิงก์รูปภาพ"><span><IconButton id="save" type="submit" size="small" aria-label="บันทึก" disabled={artworkDisabled}><Icon kind="save" /></IconButton></span></Tooltip>
      </Stack>
      <Button id="clear" size="small" color="inherit" fullWidth disabled={artworkDisabled} startIcon={<Icon kind="clear" />}
        onClick={() => void run(async value => { await value.save(null); if (!disposed.current) { setUrl(""); setStatus("ล้างรูปที่ผูกไว้แล้ว"); } })}>ล้างรูปที่ผูกไว้</Button>
      <Typography id="status" role="status" aria-live="polite" variant="caption" sx={{ color: "text.secondary", fontSize: 10, lineHeight: 1.4, overflowWrap: "anywhere" }}>{status}</Typography>
    </Stack>
  </ThemeProvider>;
}
export function startPanel(api: typeof OBR) {
  const root = createRoot(document.querySelector("#root")!);
  root.render(<Panel api={api} />);
  window.addEventListener("pagehide", () => root.unmount(), { once: true });
}
