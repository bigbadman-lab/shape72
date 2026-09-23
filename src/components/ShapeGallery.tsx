import { type Shape } from "@/data/shapes";
import { ShapeTile } from "@/components/ShapeTile";

interface ShapeGalleryProps {
  shapes: Shape[];
  walletConnected: boolean;
  onOpen: (id: number) => void;
}

export function ShapeGallery({
  shapes,
  walletConnected,
  onOpen,
}: ShapeGalleryProps) {
  return (
    <main className="mt-10 grid grid-cols-2 gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {shapes.map((shape) => (
        <ShapeTile
          key={shape.id}
          shape={shape}
          walletConnected={walletConnected}
          onOpen={() => onOpen(shape.id)}
        />
      ))}
    </main>
  );
}
