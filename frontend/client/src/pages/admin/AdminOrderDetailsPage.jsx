import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { orderService } from "../../services/cartService";
import { formatCurrency, formatDate } from "../../utils/formatters";

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

const AdminOrderDetailsPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadOrder = async () => {
        try {
            setIsLoading(true);
            const res = await orderService.getOrderById(orderId);
            setOrder(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not load order");
            navigate("/admin/orders");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const updateOrder = async (payload, message) => {
        try {
            const res = await orderService.updateOrderStatus(orderId, payload);
            setOrder(res.data);
            toast.success(message);
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not update order");
        }
    };

    if (isLoading) return <div className="py-12 text-center text-sm text-stone">Loading order details...</div>;
    if (!order) return null;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <button type="button" onClick={() => navigate("/admin/orders")} className="mb-3 inline-flex items-center gap-2 text-sm text-stone hover:text-[var(--accent)]">
                        <ArrowLeft size={15} /> Back to Orders
                    </button>
                    <h1 className="font-display text-3xl tracking-tightest">{order.orderNumber}</h1>
                    <p className="mt-1 text-sm text-stone">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select value={order.orderStatus} onChange={(event) => updateOrder({ status: event.target.value }, "Order status updated")} className="rounded-lg border border-ink/12 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none dark:border-cream/15 dark:bg-[var(--bg-raised)] dark:text-[var(--ink)]">
                        {statusOptions.map((status) => <option key={status} value={status} className="bg-[var(--surface)] text-[var(--ink)] dark:bg-[var(--bg-raised)] dark:text-[var(--ink)]">{status}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
                <section className="card-surface p-5">
                    <h2 className="mb-4 text-lg font-semibold">Products</h2>
                    <div className="flex flex-col divide-y divide-hairline dark:divide-hairline-dark">
                        {order.items.map((item, index) => {
                            const product = item.product && typeof item.product === "object" ? item.product : null;
                            const image = item.image || product?.images?.[0]?.url;
                            return (
                                <div key={`${item.product?._id || item.product || item.name}-${index}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                    <img src={image || "https://via.placeholder.com/96?text=Product"} alt={item.name} className="h-24 w-20 rounded-lg object-cover" />
                                    <div className="min-w-0 flex-1">
                                        {product?.slug ? <Link to={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="font-semibold hover:text-[var(--accent)]">{item.name}</Link> : <p className="font-semibold">{item.name}</p>}
                                        <p className="mt-1 text-sm text-stone">Qty {item.quantity}{item.color ? ` · ${item.color}` : ""}{item.size ? ` · ${item.size}` : ""}</p>
                                        <p className="mt-2 font-semibold tabular-nums">{formatCurrency(item.price * item.quantity)}</p>
                                        {product?.slug && <Link to={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">View product <ExternalLink size={12} /></Link>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="flex flex-col gap-6">
                    <section className="card-surface p-5">
                        <h2 className="mb-3 text-lg font-semibold">Customer</h2>
                        <p className="font-medium">{order.user?.name}</p>
                        <p className="text-sm text-stone">{order.user?.email}</p>
                        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone">Shipping Address</h3>
                        <p className="mt-2 text-sm">{order.shippingAddress.fullName}, {order.shippingAddress.phone}</p>
                        <p className="text-sm text-stone">{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                    </section>
                    <section className="card-surface p-5">
                        <h2 className="mb-3 text-lg font-semibold">Payment Summary</h2>
                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex justify-between text-stone"><span>Items</span><span>{formatCurrency(order.itemsPrice)}</span></div>
                            <div className="flex justify-between text-stone"><span>Tax</span><span>{formatCurrency(order.taxPrice)}</span></div>
                            <div className="flex justify-between text-stone"><span>Shipping</span><span>{order.shippingPrice ? formatCurrency(order.shippingPrice) : "Free"}</span></div>
                            <div className="flex justify-between border-t border-hairline pt-2 font-semibold dark:border-hairline-dark"><span>Total</span><span>{formatCurrency(order.totalPrice)}</span></div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetailsPage;
