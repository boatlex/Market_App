import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../../contexts/authContext';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    useAdminStats,
    useAdminUsers,
    useAdminProducts,
    useAdminReports,
    useAdminProviders,
    useAdminJobs,
    useAdminJobSeekers,
    useAdminFeedback,
} from '../../hooks/useAdmin';
import { ReportStatus, FeedbackStatus, PaginationMeta } from '../../types';
import AdminReportCard from '../../components/admin/AdminReportCard';
import AdminFeedbackCard from '../../components/admin/AdminFeedBackCard';
import AdminProductCard from '../../components/admin/AdminProductCard';
import AdminProviderCard from '../../components/admin/AdminProviderCard';
import AdminJobCard from '../../components/admin/AdminJobCard';
import AdminJobSeekerCard from '../../components/admin/AdminJobSeekerCard';
import AdminUserCard from '../../components/admin/AdminUserCard';
import RefreshButton from '../../components/admin/RefreshButton';

type AdminTab =
    | 'reports'
    | 'feedback'
    | 'products'
    | 'providers'
    | 'jobs'
    | 'jobseekers'
    | 'users';

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
    { key: 'reports', label: 'Reports' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'products', label: 'Products' },
    { key: 'providers', label: 'Providers' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'jobseekers', label: 'Job Seekers' },
    { key: 'users', label: 'Users' },
];

const STATUS_FILTERS: { label: string; value?: ReportStatus }[] = [
    { label: 'All', value: undefined },
    { label: 'Pending', value: 'pending' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Dismissed', value: 'dismissed' },
];

const FEEDBACK_STATUS_FILTERS: { label: string; value?: FeedbackStatus }[] = [
    { label: 'All', value: undefined },
    { label: 'New', value: 'new' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Resolved', value: 'resolved' },
];

export default function AdminScreen() {
    const { user, isInitializing: isAuthLoading } = useAuth();

    // 1. All state hooks
    const [activeTab, setActiveTab] = useState<AdminTab>('reports');

    const [reportPage, setReportPage] = useState(1);
    const [reportStatus, setReportStatus] = useState<ReportStatus | undefined>('pending');

    const [feedbackPage, setFeedbackPage] = useState(1);
    const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus | undefined>('new');

    const [productPage, setProductPage] = useState(1);
    const [productSearch, setProductSearch] = useState('');

    const [providerPage, setProviderPage] = useState(1);
    const [providerSearch, setProviderSearch] = useState('');
    const [providerVerified, setProviderVerified] = useState<'true' | 'false' | undefined>(undefined);

    const [jobPage, setJobPage] = useState(1);
    const [jobSearch, setJobSearch] = useState('');

    const [seekerPage, setSeekerPage] = useState(1);
    const [seekerSearch, setSeekerSearch] = useState('');

    const [userPage, setUserPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 2. All query hooks MUST run before any early return
    const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useAdminStats();

    const {
        reports,
        pagination: reportsPagination,
        isLoadingReports,
        refetchReports,
        updateReportStatus,
        isUpdatingStatus,
        updatingReportId,
    } = useAdminReports({
        page: reportPage,
        limit: 10,
        status: reportStatus,
        enabled: activeTab === 'reports',
    });

    const {
        feedbackList,
        pagination: feedbackPagination,
        isLoadingFeedback,
        refetchFeedback,
        updateFeedbackStatus,
        isUpdatingFeedbackStatus,
        updatingFeedbackId,
    } = useAdminFeedback({
        page: feedbackPage,
        limit: 10,
        status: feedbackStatus,
        enabled: activeTab === 'feedback',
    });

    const {
        products,
        pagination: productsPagination,
        isLoadingProducts,
        refetchProducts,
        deleteProduct,
        isDeletingProduct,
        deletingProductId,
    } = useAdminProducts({
        page: productPage,
        limit: 10,
        search: productSearch,
        enabled: activeTab === 'products',
    });

    const {
        providers,
        pagination: providersPagination,
        isLoadingProviders,
        refetchProviders,
        toggleVerification,
        isTogglingVerification,
        togglingProviderId,
        deleteProvider,
        isDeletingProvider,
        deletingProviderId,
    } = useAdminProviders({
        page: providerPage,
        limit: 10,
        search: providerSearch,
        verified: providerVerified,
        enabled: activeTab === 'providers',
    });

    const {
        jobs,
        pagination: jobsPagination,
        isLoadingJobs,
        refetchJobs,
        deleteJob,
        isDeletingJob,
        deletingJobId,
    } = useAdminJobs({
        page: jobPage,
        limit: 10,
        search: jobSearch,
        enabled: activeTab === 'jobs',
    });

    const {
        jobSeekers,
        pagination: seekersPagination,
        isLoadingJobSeekers,
        refetchJobSeekers,
        deleteJobSeeker,
        isDeletingJobSeeker,
        deletingJobSeekerId,
    } = useAdminJobSeekers({
        page: seekerPage,
        limit: 10,
        search: seekerSearch,
        enabled: activeTab === 'jobseekers',
    });

    const {
        users,
        pagination: usersPagination,
        isLoading: isLoadingUsers,
        refetch: refetchUsers,
        toggleUserVerification,
        isTogglingUserVerification,
        togglingUserId,
        deleteUser,
        isDeletingUser,
        deletingUserId,
    } = useAdminUsers({
        page: userPage,
        limit: 10,
        search: userSearch,
        enabled: activeTab === 'users',
    });

    // 3. Auth & Role Guard
    if (isAuthLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </SafeAreaView>
        );
    }

    if (user?.role !== 'admin') {
        return <Redirect href="/(tabs)" />;
    }

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await Promise.all([
                refetchStats(),
                activeTab === 'reports' ? refetchReports() : Promise.resolve(),
                activeTab === 'feedback' ? refetchFeedback() : Promise.resolve(),
                activeTab === 'products' ? refetchProducts() : Promise.resolve(),
                activeTab === 'providers' ? refetchProviders() : Promise.resolve(),
                activeTab === 'jobs' ? refetchJobs() : Promise.resolve(),
                activeTab === 'jobseekers' ? refetchJobSeekers() : Promise.resolve(),
                activeTab === 'users' ? refetchUsers() : Promise.resolve(),
            ]);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Active tab resolution helpers
    const getActiveListConfig = (): {
        data: any[];
        isLoading: boolean;
        pagination?: PaginationMeta;
        page: number;
        setPage: React.Dispatch<React.SetStateAction<number>>;
        emptyMessage: string;
    } => {
        switch (activeTab) {
            case 'reports':
                return {
                    data: reports,
                    isLoading: isLoadingReports,
                    pagination: reportsPagination,
                    page: reportPage,
                    setPage: setReportPage,
                    emptyMessage: 'No reports found for this filter.',
                };
            case 'feedback':
                return {
                    data: feedbackList,
                    isLoading: isLoadingFeedback,
                    pagination: feedbackPagination,
                    page: feedbackPage,
                    setPage: setFeedbackPage,
                    emptyMessage: 'No feedback entries found.',
                };
            case 'products':
                return {
                    data: products,
                    isLoading: isLoadingProducts,
                    pagination: productsPagination,
                    page: productPage,
                    setPage: setProductPage,
                    emptyMessage: 'No products found.',
                };
            case 'providers':
                return {
                    data: providers,
                    isLoading: isLoadingProviders,
                    pagination: providersPagination,
                    page: providerPage,
                    setPage: setProviderPage,
                    emptyMessage: 'No service providers found.',
                };
            case 'jobs':
                return {
                    data: jobs,
                    isLoading: isLoadingJobs,
                    pagination: jobsPagination,
                    page: jobPage,
                    setPage: setJobPage,
                    emptyMessage: 'No jobs found.',
                };
            case 'jobseekers':
                return {
                    data: jobSeekers,
                    isLoading: isLoadingJobSeekers,
                    pagination: seekersPagination,
                    page: seekerPage,
                    setPage: setSeekerPage,
                                     emptyMessage: 'No job seekers found.',
                };
            case 'users':
                return {
                    data: users,
                    isLoading: isLoadingUsers,
                    pagination: usersPagination,
                    page: userPage,
                    setPage: setUserPage,
                    emptyMessage: 'No users found.',
                };
        }
    };

    const renderActiveItem = ({ item }: { item: any }) => {
        switch (activeTab) {
            case 'reports':
                           case 'reports':
                return (
                    <AdminReportCard
                        report={item}
                        onUpdateStatus={updateReportStatus}
                        isBusy={isUpdatingStatus && updatingReportId === item._id}
                    />
                );

            case 'feedback':
                return (
                    <AdminFeedbackCard
                        item={item}
                        onUpdateStatus={(feedbackId, nextStatus) =>
                            updateFeedbackStatus({ feedbackId, nextStatus })
                        }
                        isUpdating={
                            isUpdatingFeedbackStatus && updatingFeedbackId === item._id
                        }
                    />
                );
            case 'products':
                return (
                    <AdminProductCard
                        product={item}
                        onDelete={(productId) => deleteProduct(productId)}
                        isDeleting={isDeletingProduct && deletingProductId === item._id}
                    />
                );
            case 'providers':
                          case 'providers':
                return (
                    <AdminProviderCard
                        provider={item}
                        onToggleVerify={toggleVerification}
                        isToggling={
                            isTogglingVerification && togglingProviderId === item._id
                        }
                        onDelete={deleteProvider}
                        isDeleting={isDeletingProvider && deletingProviderId === item._id}
                    />
                );

            case 'jobs':
                return (
                    <AdminJobCard
                        job={item}
                        onDelete={(jobId) => deleteJob(jobId)}
                        isDeleting={isDeletingJob && deletingJobId === item._id}
                    />
                );
            case 'jobseekers':
            
                return (
                    <AdminJobSeekerCard
                        seeker={item}
                        onDelete={deleteJobSeeker}
                        isDeleting={
                            isDeletingJobSeeker && deletingJobSeekerId === item._id
                        }
                    />
                );

            case 'users':
                return (
                    <AdminUserCard
                        user={item}
                        onToggleVerify={toggleUserVerification}
                        isToggling={
                            isTogglingUserVerification && togglingUserId === item._id
                        }
                        onDelete={deleteUser}
                        isDeleting={isDeletingUser && deletingUserId === item._id}
                    />
                );

        }
    };

    const activeConfig = getActiveListConfig();

    const headerElement = (
        <View className="mb-3">
            {/* Top Bar */}
            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-2xl font-bold text-gray-900">Admin Console</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                        Marketplace moderation & insights
                    </Text>
                </View>
                <RefreshButton isRefreshing={isRefreshing} onRefresh={handleRefresh} />
            </View>

            {/* Stats Grid (6 Cards in 2 Rows) */}
            {isLoadingStats ? (
                <ActivityIndicator size="small" color="#2563EB" className="my-4" />
            ) : (
                stats && (
                    <View className="flex-row flex-wrap justify-between gap-y-2.5 mb-4">
                        {/* 1. Users */}
                        <TouchableOpacity
                            onPress={() => setActiveTab('users')}
                            activeOpacity={0.7}
                            style={{ width: '31.5%' }}
                            className="bg-white p-3 rounded-2xl border border-gray-200"
                        >
                            <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mb-1.5">
                                <Ionicons name="people" size={17} color="#2563EB" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                {stats.totalUsers}
                            </Text>
                            <Text className="text-[11px] text-gray-500 mt-0.5">Users</Text>
                        </TouchableOpacity>

                        {/* 2. Products */}
                        <TouchableOpacity
                            onPress={() => setActiveTab('products')}
                            activeOpacity={0.7}
                            style={{ width: '31.5%' }}
                            className="bg-white p-3 rounded-2xl border border-gray-200"
                        >
                            <View className="w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center mb-1.5">
                                <Ionicons name="bag-handle" size={17} color="#059669" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                {stats.totalProducts}
                            </Text>
                            <Text className="text-[11px] text-gray-500 mt-0.5">Products</Text>
                        </TouchableOpacity>

                        {/* 3. Service Providers */}
                        <TouchableOpacity
                            onPress={() => setActiveTab('providers')}
                            activeOpacity={0.7}
                            style={{ width: '31.5%' }}
                            className="bg-white p-3 rounded-2xl border border-gray-200"
                        >
                            <View className="w-8 h-8 rounded-lg bg-purple-50 items-center justify-center mb-1.5">
                                <Ionicons name="construct" size={17} color="#7C3AED" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                {stats.totalProviders}
                            </Text>
                            <Text className="text-[11px] text-gray-500 mt-0.5">Providers</Text>
                        </TouchableOpacity>

                        {/* 4. Jobs */}
                        <TouchableOpacity
                            onPress={() => setActiveTab('jobs')}
                            activeOpacity={0.7}
                            style={{ width: '31.5%' }}
                            className="bg-white p-3 rounded-2xl border border-gray-200"
                        >
                            <View className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center mb-1.5">
                                <Ionicons name="briefcase" size={17} color="#4F46E5" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                {stats.totalJobs}
                            </Text>
                            <Text className="text-[11px] text-gray-500 mt-0.5">Jobs</Text>
                        </TouchableOpacity>

                        {/* 5. Job Seekers */}
                        <TouchableOpacity
                            onPress={() => setActiveTab('jobseekers')}
                            activeOpacity={0.7}
                            style={{ width: '31.5%' }}
                            className="bg-white p-3 rounded-2xl border border-gray-200"
                        >
                            <View className="w-8 h-8 rounded-lg bg-amber-50 items-center justify-center mb-1.5">
                                <Ionicons name="document-text" size={17} color="#D97706" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                {stats.totalJobSeekers}
                            </Text>
                            <Text className="text-[11px] text-gray-500 mt-0.5">Seekers</Text>
                        </TouchableOpacity>

                        {/* 6. Pending Reports */}
                        <TouchableOpacity
                            onPress={() => {
                                setActiveTab('reports');
                                setReportStatus('pending');
                            }}
                            activeOpacity={0.7}
                            style={{ width: '31.5%' }}
                            className="bg-white p-3 rounded-2xl border border-gray-200"
                        >
                            <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center mb-1.5">
                                <Ionicons name="flag" size={17} color="#DC2626" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                {stats.reportBreakdown.pending}
                            </Text>
                            <Text className="text-[11px] text-gray-500 mt-0.5">Pending</Text>
                        </TouchableOpacity>
                    </View>
                )
            )}

            {/* Horizontal Scrollable Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                className="mb-3"
                contentContainerStyle={{
                    backgroundColor: '#E5E7EB',
                    borderRadius: 12,
                    padding: 4,
                    gap: 4,
                }}
            >
                {ADMIN_TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            className={`px-3.5 py-2 rounded-lg items-center ${
                                isActive ? 'bg-white' : ''
                            }`}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text
                                className={`text-xs font-semibold ${
                                    isActive ? 'text-gray-900' : 'text-gray-600'
                                }`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Reports Filter */}
            {activeTab === 'reports' && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                    {STATUS_FILTERS.map((filter) => {
                        const active = reportStatus === filter.value;
                        return (
                            <TouchableOpacity
                                key={filter.label}
                                className={`px-3.5 py-1.5 rounded-full border ${
                                    active
                                        ? 'bg-gray-900 border-gray-900'
                                        : 'bg-white border-gray-200'
                                }`}
                                onPress={() => {
                                    setReportStatus(filter.value);
                                    setReportPage(1);
                                }}
                            >
                                <Text
                                    className={`text-xs font-semibold ${
                                        active ? 'text-white' : 'text-gray-600'
                                    }`}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Feedback Filter */}
            {activeTab === 'feedback' && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                    {FEEDBACK_STATUS_FILTERS.map((filter) => {
                        const active = feedbackStatus === filter.value;
                        return (
                            <TouchableOpacity
                                key={filter.label}
                                className={`px-3.5 py-1.5 rounded-full border ${
                                    active
                                        ? 'bg-gray-900 border-gray-900'
                                        : 'bg-white border-gray-200'
                                }`}
                                onPress={() => {
                                    setFeedbackStatus(filter.value);
                                    setFeedbackPage(1);
                                }}
                            >
                                <Text
                                    className={`text-xs font-semibold ${
                                        active ? 'text-white' : 'text-gray-600'
                                    }`}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Products Search */}
            {activeTab === 'products' && (
                <SearchInputBar
                    value={productSearch}
                    onChangeText={(text) => {
                        setProductSearch(text);
                        setProductPage(1);
                    }}
                    placeholder="Search products by name or category..."
                />
            )}

            {/* Providers Search & Verified Filter */}
            {activeTab === 'providers' && (
                <View>
                    <SearchInputBar
                        value={providerSearch}
                        onChangeText={(text) => {
                            setProviderSearch(text);
                            setProviderPage(1);
                        }}
                        placeholder="Search service providers..."
                    />
                    <View className="flex-row gap-2 mt-2">
                        {(
                            [
                                { label: 'All', val: undefined },
                                { label: 'Verified', val: 'true' },
                                { label: 'Unverified', val: 'false' },
                            ] as const
                        ).map((item) => {
                            const active = providerVerified === item.val;
                            return (
                                <TouchableOpacity
                                    key={item.label}
                                    onPress={() => {
                                        setProviderVerified(item.val);
                                        setProviderPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-full border ${
                                        active
                                            ? 'bg-gray-900 border-gray-900'
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-semibold ${
                                            active ? 'text-white' : 'text-gray-600'
                                        }`}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Jobs Search */}
            {activeTab === 'jobs' && (
                <SearchInputBar
                    value={jobSearch}
                    onChangeText={(text) => {
                        setJobSearch(text);
                        setJobPage(1);
                    }}
                    placeholder="Search jobs by title or company..."
                />
            )}

            {/* Job Seekers Search */}
            {activeTab === 'jobseekers' && (
                <SearchInputBar
                    value={seekerSearch}
                    onChangeText={(text) => {
                        setSeekerSearch(text);
                        setSeekerPage(1);
                    }}
                    placeholder="Search job seekers by headline or skills..."
                />
            )}

            {/* Users Search */}
            {activeTab === 'users' && (
                <SearchInputBar
                    value={userSearch}
                    onChangeText={(text) => {
                        setUserSearch(text);
                        setUserPage(1);
                    }}
                    placeholder="Search users by name or email..."
                />
            )}
        </View>
    );

       return (
        <SafeAreaView className="flex-1 bg-gray-50 px-4 pt-2" edges={['top']}>
            <FlatList
                data={activeConfig.isLoading ? [] : activeConfig.data}
                keyExtractor={(item) => item._id || item.id}
                renderItem={renderActiveItem}
                ListHeaderComponent={headerElement}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 36 }}
                ListEmptyComponent={
                    activeConfig.isLoading ? (
                        <ActivityIndicator size="large" color="#2563EB" className="my-10" />
                    ) : (
                        <View className="bg-white rounded-2xl border border-gray-200 p-8 items-center mt-2">
                            <Ionicons name="folder-open-outline" size={32} color="#9CA3AF" />
                            <Text className="text-sm font-semibold text-gray-800 mt-2">
                                {activeConfig.emptyMessage}
                            </Text>
                        </View>
                    )
                }
                ListFooterComponent={
                    !activeConfig.isLoading &&
                    activeConfig.pagination &&
                    activeConfig.pagination.totalPages > 1 ? (
                        <View className="flex-row justify-between items-center mt-2 bg-white p-3 rounded-2xl border border-gray-200">
                            <TouchableOpacity
                                disabled={activeConfig.page <= 1}
                                onPress={() =>
                                    activeConfig.setPage((p) => Math.max(1, p - 1))
                                }
                                className={`px-3.5 py-2 rounded-xl border ${
                                    activeConfig.page <= 1
                                        ? 'border-gray-100 bg-gray-50'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${
                                        activeConfig.page <= 1
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    Previous
                                </Text>
                            </TouchableOpacity>

                            <Text className="text-xs font-medium text-gray-600">
                                Page {activeConfig.pagination.currentPage} of{' '}
                                {activeConfig.pagination.totalPages}
                            </Text>

                            <TouchableOpacity
                                disabled={!activeConfig.pagination.hasNextPage}
                                onPress={() => activeConfig.setPage((p) => p + 1)}
                                className={`px-3.5 py-2 rounded-xl border ${
                                    !activeConfig.pagination.hasNextPage
                                        ? 'border-gray-100 bg-gray-50'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${
                                        !activeConfig.pagination.hasNextPage
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    Next
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : undefined
                }
            />
        </SafeAreaView>
    );
}

function SearchInputBar({
    value,
    onChangeText,
    placeholder,
}: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
}) {
    return (
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                className="flex-1 ml-2 text-xs text-gray-900"
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText('')}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
            )}
        </View>
    );
}




