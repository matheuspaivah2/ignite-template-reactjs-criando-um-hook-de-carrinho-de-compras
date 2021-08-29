import { useEffect } from "react";
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: (
    productId: number,
    amount: number,
    type: "increment" | "decrement"
  ) => void;
  stock: Stock[];
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [stock, setStock] = useState<Stock[]>([]);
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart") || "";

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    async function loadStock() {
      await api.get("http://localhost:3333/stock").then((response) => {
        setStock(response.data);
      });
    }
    loadStock();
  }, []);

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get(
        `http://localhost:3333/products/${productId}`
      );
      if (cart.find((product) => product.id === data.id)) {
        const updateCart = [...cart];
        updateCart.forEach((product) => {
          if (product.id === productId) {
            if (product.amount + 1 > stock[productId - 1].amount) {
              return toast.error("Quantidade solicitada fora de estoque");
            } else {
              return (product.amount += 1);
            }
          }
        });
        setCart([...updateCart]);
      } else {
        data.amount = 1;
        setCart([...cart, data]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, data])
        );
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const newCart = await cart.filter((product) => product.id !== productId);
      setCart([...newCart]);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async (
    productId: number,
    amount: number,
    type: "increment" | "decrement"
  ) => {
    try {
      if (type === "increment") {
        if (stock[productId - 1].amount > amount) {
          const updateCart = [...cart];
          updateCart.forEach((product) => {
            if (product.id === productId) {
              product.amount += 1;
              setCart([...updateCart]);
              localStorage.setItem(
                "@RocketShoes:cart",
                JSON.stringify([...updateCart])
              );
            }
          });
        }
      } else {
        if (amount > 1) {
          const updateCart = [...cart];
          updateCart.forEach((product) => {
            if (product.id === productId) {
              product.amount -= 1;
              setCart([...updateCart]);
              localStorage.setItem(
                "@RocketShoes:cart",
                JSON.stringify([...updateCart])
              );
            }
          });
        }
      }
    } catch {
      toast.error("error");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount, stock }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
