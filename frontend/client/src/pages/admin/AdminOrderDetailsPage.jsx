import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, ExternalLink, Truck, RefreshCw, Printer, AlertCircle, CheckCircle, Package } from "lucide-react";
import { orderService } from "../../services/cartService";
import { shippingService } from "../../services/shippingService";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

const AdminOrderDetailsPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isManifesting, setIsManifesting] = useState(false);
    const [isApprovingReturn, setIsApprovingReturn] = useState(false);
    const [isProcessingExchange, setIsProcessingExchange] = useState(false);

    const loadOrder = async () => {
        try {
            setIsLoading(true);
            const res = await orderService.getOrderById(orderId);
            setOrder(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not load order");
            navigate("/seller/orders");
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

    const handleManifest = async () => {
        try {
            setIsManifesting(true);
            await shippingService.manifestOrder(orderId);
            toast.success("Manifested successfully with Delhivery!");
            loadOrder();
        } catch (err) {
            toast.error("Manifestation failed: " + (err.response?.data?.message || err.message));
        } finally {
            setIsManifesting(false);
        }
    };

    const handleApproveReturn = async () => {
        try {
            setIsApprovingReturn(true);
            await orderService.approveReturn(orderId);
            toast.success("Return approved! Reverse pickup scheduled with Delhivery.");
            loadOrder();
        } catch (err) {
            toast.error("Approval failed: " + (err.response?.data?.message || err.message));
        } finally {
            setIsApprovingReturn(false);
        }
    };

    const handleProcessExchange = async () => {
        try {
            setIsProcessingExchange(true);
            const res = await orderService.processExchange(orderId);
            toast.success(`Exchange processed! New replacement order: ${res.data.replacementOrder?.orderNumber}`);
            loadOrder();
        } catch (err) {
            toast.error("Exchange processing failed: " + (err.response?.data?.message || err.message));
        } finally {
            setIsProcessingExchange(false);
        }
    };

    if (isLoading) return <div className="py-12 text-center text-sm text-stone">Loading order details...</div>;
    if (!order) return null;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <button type="button" onClick={() => navigate("/seller/orders")} className="mb-3 inline-flex items-center gap-2 text-sm text-stone hover:text-[var(--accent)]">
                        <ArrowLeft size={15} /> Back to Orders
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="font-display text-3xl tracking-tightest">{order.orderNumber}</h1>
                        {order.returnStatus && order.returnStatus !== "Not Requested" && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                Return: {order.returnStatus}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-stone">Placed on {formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select value={order.orderStatus} onChange={(event) => updateOrder({ status: event.target.value }, "Order status updated")} className="rounded-lg border border-ink/12 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none dark:border-cream/15 dark:bg-[var(--bg-raised)] dark:text-[var(--ink)]">
                        {statusOptions.map((status) => <option key={status} value={status} className="bg-[var(--surface)] text-[var(--ink)] dark:bg-[var(--bg-raised)] dark:text-[var(--ink)]">{status}</option>)}
                    </select>
                </div>
            </div>

            {/* Return / Exchange Alert Banner */}
            {order.returnStatus && order.returnStatus !== "Not Requested" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={20} />
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Customer requested a {order.isExchange ? "Product Exchange" : "Return & Refund"} ({order.returnStatus})
                                </h3>
                                <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                                    Reason: <strong>{order.returnReason || "No reason provided"}</strong>
                                </p>
                                {order.exchangeDetails && (
                                    <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-300">
                                        Exchange Details: <strong>{typeof order.exchangeDetails === 'object' ? JSON.stringify(order.exchangeDetails) : order.exchangeDetails}</strong>
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {order.returnStatus === "Requested" && (
                                <button
                                    type="button"
                                    disabled={isApprovingReturn}
                                    onClick={handleApproveReturn}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    <CheckCircle size={14} />
                                    {isApprovingReturn ? "Scheduling Pickup..." : "Approve Return & Schedule Pickup"}
                                </button>
                            )}
                            {order.isExchange && ["Approved", "Picked Up", "Returned"].includes(order.returnStatus) && (
                                <button
                                    type="button"
                                    disabled={isProcessingExchange}
                                    onClick={handleProcessExchange}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <RefreshCw size={14} className={isProcessingExchange ? "animate-spin" : ""} />
                                    {isProcessingExchange ? "Creating Replacement..." : "Process Exchange (Create Replacement Order)"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                    {/* Delhivery Shipping Card */}
                    <section className="card-surface p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Truck size={18} className="text-[var(--accent)]" /> Delhivery Shipping
                            </h2>
                            {order.trackingNumber && (
                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    Manifested
                                </span>
                            )}
                        </div>

                        {order.trackingNumber ? (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <span className="text-xs text-stone">Waybill (AWB):</span>
                                    <p className="font-mono font-bold text-base text-[var(--accent)]">{order.trackingNumber}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <a
                                        href={`https://www.delhivery.com/track/package/${order.trackingNumber}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:bg-[var(--bg-subtle)]"
                                    >
                                        <ExternalLink size={13} /> Track on Delhivery
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <p className="text-xs text-stone">
                                    This order has not been dispatched or manifested with Delhivery yet.
                                </p>
                                {["pending", "processing"].includes(order.orderStatus) && (
                                    <button
                                        type="button"
                                        disabled={isManifesting}
                                        onClick={handleManifest}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                                    >
                                        <Truck size={16} />
                                        {isManifesting ? "Manifesting with Courier..." : "Ship via Delhivery"}
                                    </button>
                                )}
                            </div>
                        )}
                    </section>

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
                            <div className="flex justify-between text-stone"><span>Payment</span><span className="capitalize">{order.paymentMethod} · {order.paymentResult?.currency?.toUpperCase() || "INR"}</span></div>
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
