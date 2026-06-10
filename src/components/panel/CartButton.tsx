import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

interface Props {
  variant?: "header" | "floating";
}

const CartButton = ({ variant = "header" }: Props) => {
  const { count, openCart } = useCart();

  if (variant === "floating") {
    return (
      <button
        onClick={openCart}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg text-white flex items-center justify-center hover:scale-105 transition-transform"
        style={{ backgroundColor: "#16a34a" }}
        aria-label="Abrir carrito"
      >
        <ShoppingCart className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openCart}
      className="relative gap-2"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Carrito</span>
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center"
        >
          {count}
        </span>
      )}
    </Button>
  );
};

export default CartButton;