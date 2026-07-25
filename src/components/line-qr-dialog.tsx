import { useState } from "react";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const LINE_ID = "@entgroup";
const LINE_ADD_URL = "https://line.me/R/ti/p/%40njm2688e";
const LINE_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(LINE_ADD_URL)}`;

type LineQrDialogProps = {
  children: React.ReactNode;
  className?: string;
};

export function LineQrDialog({ children, className }: LineQrDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={className}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>เพิ่มเพื่อนใน LINE</DialogTitle>
          <DialogDescription>
            สแกน QR Code เพื่อแอดเพื่อน{" "}
            <span className="font-mono font-semibold text-[color:var(--brand-navy)]">{LINE_ID}</span>{" "}
            แล้วคุยกับทีมขายได้ทันที
          </DialogDescription>
        </DialogHeader>
        <div className="mx-auto mt-2 rounded-2xl border-2 border-[#06C755]/20 bg-white p-4">
          <img
            src={LINE_QR_URL}
            alt={`LINE QR Code ${LINE_ID}`}
            width={320}
            height={320}
            className="h-72 w-72"
            loading="lazy"
          />
        </div>
        <Button asChild className="mt-2 w-full gap-2 bg-[#06C755] font-semibold text-white hover:bg-[#05a548]">
          <a href={LINE_ADD_URL} target="_blank" rel="noopener noreferrer">
            เปิดในแอป LINE <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function LineQrButton({ className }: { className?: string }) {
  return (
    <LineQrDialog className={className}>
      <Button
        type="button"
        className="w-full gap-1.5 rounded-xl bg-[#06C755] px-4 py-3 font-semibold text-white hover:bg-[#05a548]"
      >
        <MessageCircle className="h-4 w-4" /> Line: {LINE_ID}
      </Button>
    </LineQrDialog>
  );
}
