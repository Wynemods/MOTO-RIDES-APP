'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  User,
  MapPin,
  Calendar
} from 'lucide-react';

interface DisputedRide {
  id: string;
  fare: number;
  currency: string;
  pickupAddress: string;
  destinationAddress: string;
  createdAt: string;
  driver: {
    name: string;
    phone: string;
    email: string;
  };
  rider: {
    name: string;
    phone: string;
    email: string;
  };
  driverCashConfirm: boolean | null;
  riderCashConfirm: boolean | null;
  disputeReason: string;
  commissionAmount?: number;
}

export default function CashPaymentDisputes() {
  const [disputes, setDisputes] = useState<DisputedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<DisputedRide | null>(null);
  const [resolution, setResolution] = useState<'confirm' | 'deny'>('confirm');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      // In a real app, this would call the API
      const mockDisputes: DisputedRide[] = [
        {
          id: '1',
          fare: 1200,
          currency: 'KSH',
          pickupAddress: 'Chuka University Main Gate',
          destinationAddress: 'Tharaka Nithi County Hospital',
          createdAt: '2024-12-20T10:30:00Z',
          driver: {
            name: 'John Mwangi',
            phone: '+254712345678',
            email: 'john@example.com'
          },
          rider: {
            name: 'Jane Wanjiku',
            phone: '+254798765432',
            email: 'jane@example.com'
          },
          driverCashConfirm: false,
          riderCashConfirm: false,
          disputeReason: 'Both parties denied cash payment',
          commissionAmount: 120
        },
        {
          id: '2',
          fare: 800,
          currency: 'KSH',
          pickupAddress: 'Chuka Town Center',
          destinationAddress: 'Chuka University Library',
          createdAt: '2024-12-19T15:45:00Z',
          driver: {
            name: 'Peter Kamau',
            phone: '+254723456789',
            email: 'peter@example.com'
          },
          rider: {
            name: 'Mary Njoki',
            phone: '+254789876543',
            email: 'mary@example.com'
          },
          driverCashConfirm: true,
          riderCashConfirm: false,
          disputeReason: 'Driver confirmed, rider denied payment',
          commissionAmount: 80
        }
      ];
      setDisputes(mockDisputes);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    try {
      setResolving(true);
      // In a real app, this would call the API
      console.log('Resolving dispute:', disputeId, resolution, adminNotes);
      
      // Remove resolved dispute from list
      setDisputes(disputes.filter(d => d.id !== disputeId));
      setSelectedDispute(null);
      setAdminNotes('');
      setResolution('confirm');
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
    } finally {
      setResolving(false);
    }
  };

  const getDisputeStatus = (dispute: DisputedRide) => {
    if (dispute.driverCashConfirm === false && dispute.riderCashConfirm === false) {
      return { status: 'both_denied', color: 'destructive', text: 'Both Denied' };
    }
    if (dispute.driverCashConfirm === true && dispute.riderCashConfirm === false) {
      return { status: 'driver_confirmed', color: 'warning', text: 'Driver Confirmed' };
    }
    if (dispute.driverCashConfirm === false && dispute.riderCashConfirm === true) {
      return { status: 'rider_confirmed', color: 'warning', text: 'Rider Confirmed' };
    }
    return { status: 'unknown', color: 'secondary', text: 'Unknown' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cash Payment Disputes</h2>
        <Badge variant="outline" className="text-sm">
          {disputes.length} Pending
        </Badge>
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Disputes</h3>
            <p className="text-gray-600">All cash payments are confirmed or resolved.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute) => {
            const disputeStatus = getDisputeStatus(dispute);
            return (
              <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Ride #{dispute.id}</CardTitle>
                    <Badge variant={disputeStatus.color as any}>
                      {disputeStatus.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ride Details */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">
                          {dispute.fare} {dispute.currency}
                        </span>
                        {dispute.commissionAmount && (
                          <span className="text-sm text-gray-500">
                            (Commission: {dispute.commissionAmount} {dispute.currency})
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium">From: {dispute.pickupAddress}</p>
                          <p className="text-sm font-medium">To: {dispute.destinationAddress}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">
                          {formatDate(dispute.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Driver</h4>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium">{dispute.driver.name}</p>
                            <p className="text-xs text-gray-600">{dispute.driver.phone}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={dispute.driverCashConfirm ? "default" : "destructive"}
                          className="mt-1"
                        >
                          {dispute.driverCashConfirm ? 'Confirmed' : 'Denied'}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Rider</h4>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium">{dispute.rider.name}</p>
                            <p className="text-xs text-gray-600">{dispute.rider.phone}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={dispute.riderCashConfirm ? "default" : "destructive"}
                          className="mt-1"
                        >
                          {dispute.riderCashConfirm ? 'Confirmed' : 'Denied'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Dispute Reason */}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Dispute Reason</p>
                        <p className="text-sm text-yellow-700">{dispute.disputeReason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Actions */}
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h4 className="font-semibold">Admin Resolution</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Resolution</label>
                        <Select value={resolution} onValueChange={(value: 'confirm' | 'deny') => setResolution(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confirm">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>Confirm Payment</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="deny">
                              <div className="flex items-center space-x-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span>Deny Payment</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                        <Textarea
                          placeholder="Enter resolution notes..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleResolveDispute(dispute.id)}
                        disabled={resolving || !adminNotes.trim()}
                        className="flex-1"
                      >
                        {resolving ? 'Resolving...' : 'Resolve Dispute'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
