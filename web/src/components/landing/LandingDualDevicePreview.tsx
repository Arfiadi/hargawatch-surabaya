import Image from "next/image";

export default function LandingDualDevicePreview() {
  return (
    <figure className="lw-dashboard-mockup w-full flex justify-center">
      <Image
        src="/landing/hargawatch-device-stack.png"
        alt="Mockup HargaWatch pada laptop dan ponsel dengan dashboard harga serta Smart Shopping Basket"
        width={1120}
        height={596}
        sizes="(max-width: 1023px) 100vw, 55vw"
        className="w-full h-auto max-w-xl xl:max-w-2xl drop-shadow-2xl"
        priority
      />
    </figure>
  );
}
