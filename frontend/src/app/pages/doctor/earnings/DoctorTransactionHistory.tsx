import React from 'react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Search, Filter, Download, Calendar, DollarSign,
  CreditCard, Clock, CheckCircle, XCircle, AlertCircle, Eye,
  ChevronDown, ChevronUp, RefreshCw, FileText, Wallet, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';

interface Transaction {
  id: string;
  date: string;
  patient_id: string;
  patient_name: string;
  patient_avatar?: string;
  appointment_id: string;
  type: 'consultation' | 'follow_up' | 'procedure' | 'emergency';
  service_name: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'insurance' | 'wallet';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transaction_id: string;
  notes?: string;
  refund_reason?: string;
  processing_fee?: number;
  net_amount: number;
}

interface TransactionSummary {
  total_transactions: number;
  total_amount: number;
  completed_amount: number;
  pending_amount: number;
  failed_amount: number;
  refunded_amount: number;
  avg_transaction: number;
}

interface TransactionResponse {
  transactions: Transaction[];
  summary: TransactionSummary;
}

export default function DoctorTransactionHistory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('date');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [selectedDateRange, setSelectedDateRange] = React.useState<{from: Date, to: Date} | undefined>();

  const { data: transactionData, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor-transactions', statusFilter, typeFilter, paymentMethodFilter, sortBy, sortOrder, selectedDateRange],
    queryFn: async (): Promise<TransactionResponse> => {
      const params: Record<string, string> = {
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (paymentMethodFilter !== 'all') params.payment_method = paymentMethodFilter;
      if (selectedDateRange?.from) params.start_date = selectedDateRange.from.toISOString();
      if (selectedDateRange?.to) params.end_date = selectedDateRange.to.toISOString();

      const response = await api.get<TransactionResponse>('/api/v1/doctor/transactions', { params });
      return response.data;
    }
  });

  // Client-side search filter (backend handles status/type/method/date filters)
  const filteredTransactions = (transactionData?.transactions || []).filter((transaction: Transaction) => {
    if (!searchQuery) return true;
    return (
      transaction.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.service_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'refunded': return <AlertCircle className="w-4 h-4 text-sky-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'failed': return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
      case 'refunded': return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20';
      default: return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'card': return <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'upi': return <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'insurance': return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'wallet': return <Wallet className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
      default: return <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="w-[300px] h-[40px] bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-[120px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <Skeleton className="h-[600px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white">
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Unable to Load Transactions</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">There was an error loading your transaction history.</p>
          <Button onClick={() => refetch()} className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 transition-all">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const summary = transactionData?.summary;

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/doctor/earnings')}
              className="p-2 hover:bg-white/20 dark:hover:bg-slate-850/30 border border-transparent hover:border-slate-200/50 dark:hover:border-white/10 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-350" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Transaction History</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Detailed view of all your payment transactions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-800/50 hover:text-sky-500 dark:hover:text-sky-400 text-slate-700 dark:text-slate-300 rounded-xl transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Transactions</p>
                    <p className="text-2xl font-bold text-slate-950 dark:text-white mt-0.5">{summary?.total_transactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{summary?.completed_amount?.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">₹{summary?.pending_amount?.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner">
                    <DollarSign className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Transaction</p>
                    <p className="text-2xl font-bold text-slate-950 dark:text-white mt-0.5">₹{summary?.avg_transaction?.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">

                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by patient, transaction ID, or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 rounded-xl focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-[160px] bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-900 dark:text-white rounded-xl transition-all">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-gray-250/50 dark:border-white/10 rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full lg:w-[160px] bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-900 dark:text-white rounded-xl transition-all">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-955/95 backdrop-blur-md border-gray-250/50 dark:border-white/10 rounded-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>

                {/* Payment Method Filter */}
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="w-full lg:w-[160px] bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-900 dark:text-white rounded-xl transition-all">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-955/95 backdrop-blur-md border-gray-250/50 dark:border-white/10 rounded-xl">
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}>
                  <SelectTrigger className="w-full lg:w-[160px] bg-white/40 dark:bg-slate-900/30 border-gray-250/50 dark:border-white/10 text-slate-900 dark:text-white rounded-xl transition-all">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-955/95 backdrop-blur-md border-gray-250/50 dark:border-white/10 rounded-xl">
                    <SelectItem value="date-desc">Latest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="amount-desc">Amount High</SelectItem>
                    <SelectItem value="amount-asc">Amount Low</SelectItem>
                    <SelectItem value="patient-asc">Patient A-Z</SelectItem>
                    <SelectItem value="patient-desc">Patient Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-200/50 dark:border-white/10 px-6 py-5">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Transactions</span>
                <Badge variant="secondary" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold px-2 py-0.5 rounded-md">
                  {filteredTransactions.length} Total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-200/50 dark:border-slate-700/50">
                    <FileText className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Transactions Found</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm">
                    {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || paymentMethodFilter !== 'all'
                      ? 'Try adjusting your search query or expanding the selection filters.'
                      : 'No transaction history has been logged yet for your clinical portal.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/50 dark:divide-slate-800/50">
                  {filteredTransactions.map((transaction: Transaction, index: number) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(0.04 * index, 0.4), duration: 0.3 }}
                      className="p-6 hover:bg-white/40 dark:hover:bg-slate-950/20 transition-colors duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                        {/* Left Side - Patient & Service Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="w-12 h-12 ring-2 ring-sky-500/20 dark:ring-sky-600/30">
                            <AvatarImage src={transaction.patient_avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-600 text-white font-bold text-sm">
                              {transaction.patient_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900 dark:text-white hover:text-sky-500 dark:hover:text-sky-400 transition-colors cursor-pointer">{transaction.patient_name}</h3>
                              <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 capitalize font-medium text-[10px] px-2 py-0.5 rounded-full">
                                {transaction.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-350 font-medium">{transaction.service_name}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(transaction.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(transaction.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span>ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-500 dark:text-slate-400 font-mono">{transaction.transaction_id}</code></span>
                            </div>
                          </div>
                        </div>

                        {/* Center - Payment Method */}
                        <div className="flex items-center gap-2.5 md:justify-center md:px-4">
                          <div className="w-8 h-8 rounded-lg bg-slate-150 dark:bg-slate-800/40 flex items-center justify-center border border-slate-200/50 dark:border-white/5 shadow-sm">
                            {getPaymentMethodIcon(transaction.payment_method)}
                          </div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">
                            {transaction.payment_method}
                          </span>
                        </div>

                        {/* Right Side - Amount & Status */}
                        <div className="text-left md:text-right flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:gap-1.5 min-w-[140px]">
                          <div>
                            <Badge className={`${getStatusColor(transaction.status)} border rounded-full px-2.5 py-0.5 font-semibold text-xs flex items-center gap-1.5 shadow-sm`}>
                              {getStatusIcon(transaction.status)}
                              <span className="capitalize">{transaction.status}</span>
                            </Badge>
                          </div>
                          <div className="mt-1">
                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                              ₹{transaction.amount.toLocaleString()}
                            </p>
                            {transaction.processing_fee && transaction.processing_fee > 0 ? (
                              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                Net: ₹{transaction.net_amount.toLocaleString()}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info for Failed/Refunded */}
                      {(transaction.notes || transaction.refund_reason) ? (
                        <>
                          <Separator className="my-4 border-slate-200/50 dark:border-white/10" />
                          <div className="flex items-center gap-2 text-sm bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                              <strong>Note: </strong> {transaction.notes || transaction.refund_reason}
                            </span>
                          </div>
                        </>
                      ) : null}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
