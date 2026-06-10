export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/+241XXXXXXXXX"
      target="_blank"
      rel="noreferrer"
      aria-label="Contactez-nous sur WhatsApp"
      title="Contactez-nous sur WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition hover:scale-105 pulse-wa"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.272-.099-.47-.149-.67.149-.198.297-.768.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.199-.297.299-.495.099-.198.05-.372-.025-.521-.074-.149-.67-1.612-.92-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.372-.01-.571-.01-.198 0-.521.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.2 5.076 4.487.709.307 1.263.49 1.694.627.712.227 1.36.195 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.174-1.413-.074-.125-.272-.198-.571-.347z" />
      </svg>
    </a>
  );
}
