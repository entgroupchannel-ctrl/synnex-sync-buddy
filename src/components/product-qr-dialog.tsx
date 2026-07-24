import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QrCode, Copy, ExternalLink, Facebook, MessageCircle, Twitter, Link as LinkIcon, Check, X } from "lucide-react";

interface ProductQrDialogProps {
  url: string;
  productName?: string;
  children?: React.ReactNode;
}

export function ProductQrDialog({ url, productName, children }: ProductQrDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("คัดลอกลิงก์แล้ว!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกลิงก์");
    }
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "width=600,height=400");
  };

  const shareLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, "_blank");
  };

  const shareX = () => {
    window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(productName ?? "")}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
            aria-label="สแกน QR Code เปิดในมือถือ"
          >
            <QrCode className="h-4 w-4 text-slate-600" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl border-slate-200 p-0 sm:max-w-md">
        <DialogHeader className="relative border-b border-slate-100 px-6 pb-4 pt-5 text-center">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="ปิด"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogTitle className="text-lg font-bold text-slate-900">สแกนเปิดหน้านี้ในมือถือ</DialogTitle>
          <p className="mx-auto max-w-[260px] text-sm text-slate-500">
            ใช้กล้องมือถือสแกน QR Code เพื่อเปิดหน้านี้ด้วยมือถือได้ทันที
          </p>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 px-6 py-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <QRCodeSVG
              value={url}
              size={200}
              level="M"
              includeMargin={false}
              imageSettings={{
                src: "https://shop.entgroup.co.th/favicon.ico",
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>

          <div className="w-full rounded-lg bg-slate-50 px-3 py-2 text-center text-sm text-slate-600 break-all">
            {url}
          </div>

          <div className="grid w-full grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="h-10 gap-2 rounded-xl border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              คัดลอกลิงก์
            </Button>
            <Button
              type="button"
              onClick={() => window.open(url, "_blank")}
              className="h-10 gap-2 rounded-xl bg-[color:var(--brand-green)] font-semibold text-white hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" />
              เปิดลิงก์
            </Button>
          </div>

          <div className="w-full">
            <div className="mb-3 text-center text-xs font-medium text-slate-400">แชร์หน้านี้</div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={shareFacebook}
                className="flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" style={{ color: "#1877F2" }} />
                <span className="text-[10px] text-slate-500">Facebook</span>
              </button>
              <button
                type="button"
                onClick={shareLine}
                className="flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="LINE"
              >
                <MessageCircle className="h-4 w-4" style={{ color: "#06C755" }} />
                <span className="text-[10px] text-slate-500">LINE</span>
              </button>
              <button
                type="button"
                onClick={shareX}
                className="flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="X"
              >
                <Twitter className="h-4 w-4 text-slate-900" />
                <span className="text-[10px] text-slate-500">X</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="คัดลอกลิงก์"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <LinkIcon className="h-4 w-4 text-slate-600" />}
                <span className="text-[10px] text-slate-500">อื่นๆ</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
