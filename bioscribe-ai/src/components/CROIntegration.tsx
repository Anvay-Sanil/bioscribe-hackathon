import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Truck,
    Building2,
    Clock,
    DollarSign,
    Package,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    FileText,
    Send,
    Star,
    Globe,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CROPartner {
    id: string;
    name: string;
    logo: string;
    rating: number;
    location: string;
    specialties: string[];
    avgTurnaround: string;
    minOrder: string;
    status: 'available' | 'busy' | 'offline';
}

interface SynthesisOrder {
    id: string;
    cro: string;
    compound: string;
    quantity: string;
    status: 'quote' | 'ordered' | 'synthesis' | 'qc' | 'shipped' | 'delivered';
    price: number;
    orderDate: Date;
    estimatedDelivery: Date;
    trackingNumber?: string;
}

export function CROIntegration() {
    const [selectedCRO, setSelectedCRO] = useState<string | null>(null);
    const [showQuote, setShowQuote] = useState(false);

    const croPartners: CROPartner[] = [
        {
            id: 'cro-1',
            name: 'Enamine',
            logo: 'EN',
            rating: 4.8,
            location: 'Ukraine/USA',
            specialties: ['Custom Synthesis', 'Building Blocks', 'Screening Libraries'],
            avgTurnaround: '4-6 weeks',
            minOrder: '$500',
            status: 'available'
        },
        {
            id: 'cro-2',
            name: 'WuXi AppTec',
            logo: 'WX',
            rating: 4.9,
            location: 'China/USA',
            specialties: ['Lead Optimization', 'Scale-up', 'GMP Synthesis'],
            avgTurnaround: '3-5 weeks',
            minOrder: '$1,000',
            status: 'available'
        },
        {
            id: 'cro-3',
            name: 'ChemPartner',
            logo: 'CP',
            rating: 4.7,
            location: 'China',
            specialties: ['Medicinal Chemistry', 'Hit-to-Lead', 'Process Development'],
            avgTurnaround: '5-7 weeks',
            minOrder: '$800',
            status: 'busy'
        },
        {
            id: 'cro-4',
            name: 'Evotec',
            logo: 'EV',
            rating: 4.6,
            location: 'Germany/USA',
            specialties: ['Fragment Synthesis', 'PROTACs', 'Antibody Conjugates'],
            avgTurnaround: '6-8 weeks',
            minOrder: '$1,500',
            status: 'available'
        }
    ];

    const orders: SynthesisOrder[] = [
        {
            id: 'ord-1',
            cro: 'WuXi AppTec',
            compound: 'BS-2024-089',
            quantity: '100mg',
            status: 'shipped',
            price: 2450,
            orderDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            trackingNumber: 'DHL-7843920147'
        },
        {
            id: 'ord-2',
            cro: 'Enamine',
            compound: 'BS-2024-123',
            quantity: '50mg',
            status: 'synthesis',
            price: 1850,
            orderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        {
            id: 'ord-3',
            cro: 'Enamine',
            compound: 'BS-2024-145',
            quantity: '25mg',
            status: 'quote',
            price: 950,
            orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            estimatedDelivery: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'quote': return 'bg-slate-400 text-white';
            case 'ordered': return 'bg-blue-500 text-white';
            case 'synthesis': return 'bg-purple-500 text-white';
            case 'qc': return 'bg-orange-500 text-white';
            case 'shipped': return 'bg-green-500 text-white';
            case 'delivered': return 'bg-emerald-600 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'quote': return 'Quote Pending';
            case 'ordered': return 'Order Confirmed';
            case 'synthesis': return 'In Synthesis';
            case 'qc': return 'Quality Control';
            case 'shipped': return 'Shipped';
            case 'delivered': return 'Delivered';
            default: return status;
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-orange-50/50 to-red-50/50 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-6 h-6 text-orange-600" />
                        CRO Integration
                    </h2>
                    <p className="text-slate-500">Order custom synthesis from partner organizations</p>
                </div>
                <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm px-4 py-2">
                    <Building2 className="w-4 h-4 mr-2" />
                    4 Partners
                </Badge>
            </div>

            {/* CRO Partners */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Partner Organizations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {croPartners.map((cro, idx) => (
                        <motion.div
                            key={cro.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card
                                className={`cursor-pointer transition-all hover:shadow-lg ${selectedCRO === cro.id ? 'border-2 border-orange-500' : 'border hover:border-orange-300'
                                    } ${cro.status === 'offline' ? 'opacity-50' : ''}`}
                                onClick={() => cro.status !== 'offline' && setSelectedCRO(cro.id)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-xl shrink-0">
                                            {cro.logo}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-900">{cro.name}</h4>
                                                <Badge className={`text-xs ${cro.status === 'available' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        cro.status === 'busy' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                            'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}>
                                                    {cro.status === 'available' ? 'Available' : cro.status === 'busy' ? 'Busy' : 'Offline'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <Globe className="w-4 h-4" />
                                                    {cro.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500" />
                                                    {cro.rating}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex flex-wrap gap-1">
                                            {cro.specialties.map((spec, i) => (
                                                <Badge key={i} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                                    {spec}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                            <span className="text-slate-600">{cro.avgTurnaround}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-green-600" />
                                            <span className="text-slate-600">Min: {cro.minOrder}</span>
                                        </div>
                                    </div>

                                    {selectedCRO === cro.id && (
                                        <Button
                                            className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowQuote(true);
                                            }}
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Request Quote
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Active Orders */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Active Orders</h3>
                <div className="space-y-4">
                    {orders.map((order, idx) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-bold text-slate-900">{order.compound}</h4>
                                                <Badge className={getStatusColor(order.status)}>
                                                    {getStatusLabel(order.status)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-4 h-4" />
                                                    {order.cro}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Package className="w-4 h-4" />
                                                    {order.quantity}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    ${order.price.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Order Date</div>
                                            <div className="text-sm font-medium text-slate-900">{formatDate(order.orderDate)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Est. Delivery</div>
                                            <div className="text-sm font-medium text-slate-900">{formatDate(order.estimatedDelivery)}</div>
                                        </div>
                                        {order.trackingNumber && (
                                            <div>
                                                <div className="text-xs text-slate-500 mb-1">Tracking</div>
                                                <div className="text-sm font-mono font-bold text-blue-600">{order.trackingNumber}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                                            <span>Quote</span>
                                            <span>Ordered</span>
                                            <span>Synthesis</span>
                                            <span>QC</span>
                                            <span>Shipped</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {['quote', 'ordered', 'synthesis', 'qc', 'shipped'].map((step, i) => {
                                                const stepOrder = ['quote', 'ordered', 'synthesis', 'qc', 'shipped'];
                                                const currentIndex = stepOrder.indexOf(order.status);
                                                const isComplete = i <= currentIndex;
                                                return (
                                                    <div
                                                        key={step}
                                                        className={`flex-1 h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-slate-200'
                                                            }`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <FileText className="w-3 h-3 mr-1" />
                                            View Order
                                        </Button>
                                        {order.trackingNumber && (
                                            <Button variant="outline" size="sm">
                                                <Truck className="w-3 h-3 mr-1" />
                                                Track Shipment
                                            </Button>
                                        )}
                                        {order.status === 'quote' && (
                                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Approve Quote
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Quote Modal Simulation */}
            {showQuote && (
                <Card className="border-2 border-orange-500 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Synthesis Quote</span>
                            <Button variant="ghost" size="sm" onClick={() => setShowQuote(false)}>×</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-semibold">Compound ID</Label>
                                    <Input value="BS-2024-156" readOnly className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold">Quantity</Label>
                                    <Input placeholder="e.g., 100mg" className="mt-1" />
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Synthesis Cost</span>
                                    <span className="font-bold text-slate-900">$1,850</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Shipping (DHL Express)</span>
                                    <span className="font-bold text-slate-900">$120</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                    <span className="text-base font-bold text-slate-900">Total</span>
                                    <span className="text-xl font-bold text-orange-600">$1,970</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="w-4 h-4" />
                                <span>Estimated delivery: 4-6 weeks</span>
                            </div>

                            <Button className="w-full bg-orange-600 hover:bg-orange-700" size="lg">
                                <Send className="w-4 h-4 mr-2" />
                                Submit Order Request
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex gap-3">
                        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-bold mb-1">Seamless Integration</p>
                            <p className="text-xs leading-relaxed">
                                One-click ordering sends your molecule specs directly to partner CROs. Track synthesis progress in real-time and receive direct shipments.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
    return <label className={className}>{children}</label>;
}
