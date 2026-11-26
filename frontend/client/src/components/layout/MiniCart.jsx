import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { X, ShoppingBag } from "lucide-react";
import { closeMiniCart, updateCartItem, removeCartItem } from "../../features/cart/cartSlice";
import { formatCurrency } from "../../utils/formatters";
import QuantityStepper from "../ui/QuantityStepper";
import Button from "../ui/Button";

const MiniCart = () => {
  const dispatch = useDispatch();
  const { isMiniCartOpen, items, subtotal } = useSelector((state) => state.cart);

  return (
    <AnimatePresence>
      {isMiniCartOpen && (
        <div className="fixed inset-0 z-[90]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeMiniCart())}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              backgroundColor: "var(--bg)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "var(--shadow-2xl)",
            }}
            className="absolute right-0 top-0 flex h-full w-full sm:max-w-md flex-col z-10"
          >
            <div
              style={{ borderBottom: "1px solid var(--border)" }}
              className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5"
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)" }}>
                Your Cart ({items.length})
              </h3>
              <button
                onClick={() => dispatch(closeMiniCart())}
                className="btn-icon"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <div
                  style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--bg-raised)",
                    color: "var(--ink-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShoppingBag size={24} />
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>Your cart is currently empty</p>
                <Link
                  to="/shop"
                  onClick={() => dispatch(closeMiniCart())}
                  className="btn-secondary !py-2 !px-4 text-xs font-bold mt-2"
                >
                  Explore Products
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                  <ul className="flex flex-col gap-4">
                    {items.map((item) => (
                      <li
                        key={item._id}
                        style={{
                          display: "flex",
                          gap: "0.875rem",
                          padding: "0.75rem",
                          borderRadius: "0.875rem",
                          backgroundColor: "var(--surface)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            height: "5.5rem",
                            width: "4.75rem",
                            borderRadius: "0.625rem",
                            objectFit: "cover",
                            backgroundColor: "var(--img-tile)",
                            border: "1px solid var(--border)",
                            flexShrink: 0,
                          }}
                        />
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
                              {item.name}
                            </p>
                            {(item.color || item.size) && (
                              <p style={{ fontSize: "0.6875rem", color: "var(--ink-muted)", marginTop: "0.15rem" }}>
                                {item.color && `${item.color} `}
                                {item.size && `· ${item.size}`}
                              </p>
                            )}
                            <p style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--ink)", marginTop: "0.25rem", whiteSpace: "nowrap" }} className="tabular-nums">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <QuantityStepper
                              size="sm"
                              quantity={item.quantity}
                              onIncrease={() =>
                                dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))
                              }
                              onDecrease={() =>
                                dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))
                              }
                            />
                            <button
                              onClick={() => dispatch(removeCartItem(item._id))}
                              style={{
                                fontSize: "0.6875rem",
                                color: "var(--red)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    backgroundColor: "var(--bg-subtle)",
                  }}
                  className="px-5 py-5 sm:px-6"
                >
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span style={{ color: "var(--ink-muted)", fontSize: "0.8125rem" }}>Subtotal</span>
                    <span style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap" }} className="tabular-nums">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <Link
                    to="/cart"
                    onClick={() => dispatch(closeMiniCart())}
                    className="btn-accent w-full block text-center"
                    style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MiniCart;
