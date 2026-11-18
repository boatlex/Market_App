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
    RefreshControl,
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
} from '../../hooks/useAdmin';
import { ReportStatus } from '../../types';
import AdminReportCard from '../../components/admin/AdminReportCard';
import AdminProductCard from '../../components/admin/AdminProductCard';
import AdminProviderCard from '../../components/admin/AdminProviderCard';
import AdminJobCard from '../../components/admin/AdminJobCard';
import AdminJobSeekerCard from '../../components/admin/AdminJobSeekerCard';
import AdminUserCard from '../../components/admin/AdminUserCard';
import RefreshButton from '../../components/admin/RefreshButton';

type AdminTab = 'reports' | 'products' | 'providers' | 'jobs' | 'jobseekers' | 'users';

const ADMIN_TABS: { key: AdminTab; label: string }[] = [
    { key: 'reports', label: 'Reports' },
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

export default function AdminScreen() {
    const { user, isInitializing: isAuthLoading } = useAuth();

    // 1. All state hooks
    const [activeTab, setActiveTab] = useState<AdminTab>('reports');

    const [reportPage, setReportPage] = useState(1);
    const [reportStatus, setReportStatus] = useState<ReportStatus | undefined>('pending');

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
    // (Auth & admin role checks are handled automatically inside each hook)
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

    const renderHeader = () => (
        <View className="mb-3">
            {/* Top Bar */}
            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-2xl font-bold text-gray-900">Admin Console</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                        Marketplace moderation & insights
                    </Text>
                </View>
                <RefreshButton
                    isRefreshing={isRefreshing}
                    onRefresh={handleRefresh}
                />
            </View>

            {/* Stats Grid */}
            {/* Stats Grid (6 Cards in 2 Rows) */}
            {isLoadingStats ? (
                <ActivityIndicator size="small" color="#2563EB" className="my-4" />
            ) : (
                stats && (
                    <View className="flex-row flex-wrap justify-between gap-y-2.5 mb-4">
                        {/* 1. Verified Users */}
                        <TouchableOpacity
                            onPress={() => setActiveTab('users')}
                            activeOpacity={0.7}
                            style={{ width: '31.5%' }}
                            className="bg-white p-3 rounded-2xl border border-gray-200"
                        >
                            <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mb-1.5">
                                <Ionicons name="people" size={17} color="#2563EB" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">{stats.totalUsers}</Text>
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
                            <Text className="text-lg font-bold text-gray-900">{stats.totalProducts}</Text>
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
                            <Text className="text-lg font-bold text-gray-900">{stats.totalProviders}</Text>
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
                            <Text className="text-lg font-bold text-gray-900">{stats.totalJobs}</Text>
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
                            <Text className="text-lg font-bold text-gray-900">{stats.totalJobSeekers}</Text>
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
                            className={`px-3.5 py-2 rounded-lg items-center ${isActive ? 'bg-white' : ''}`}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text
                                className={`text-xs font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'
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
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                    {STATUS_FILTERS.map((filter) => {
                        const active = reportStatus === filter.value;
                        return (
                            <TouchableOpacity
                                key={filter.label}
                                className={`px-3.5 py-1.5 rounded-full border ${active ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'
                                    }`}
                                onPress={() => {
                                    setReportStatus(filter.value);
                                    setReportPage(1);
                                }}
                            >
                                <Text
                                    className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-600'
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
                <View className="flex-row items-center bg-white rounded-xl px-3 h-11 border border-gray-200 gap-2">
                    <Ionicons name="search" size={18} color="#6B7280" />
                    <TextInput
                        className="flex-1 text-sm text-gray-900"
                        placeholder="Search products by name or category..."
                        placeholderTextColor="#9CA3AF"
                        value={productSearch}
                        onChangeText={(text) => {
                            setProductSearch(text);
                            setProductPage(1);
                        }}
                    />
                    {productSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setProductSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Providers Search & Filter */}
            {activeTab === 'providers' && (
                <View className="gap-2">
                    <View className="flex-row items-center bg-white rounded-xl px-3 h-11 border border-gray-200 gap-2">
                        <Ionicons name="search" size={18} color="#6B7280" />
                        <TextInput
                            className="flex-1 text-sm text-gray-900"
                            placeholder="Search providers by business or category..."
                            placeholderTextColor="#9CA3AF"
                            value={providerSearch}
                            onChangeText={(text) => {
                                setProviderSearch(text);
                                setProviderPage(1);
                            }}
                        />
                        {providerSearch.length > 0 && (
                            <TouchableOpacity onPress={() => setProviderSearch('')}>
                                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View className="flex-row gap-2">
                        {[
                            { label: 'All', value: undefined },
                            { label: 'Verified', value: 'true' as const },
                            { label: 'Unverified', value: 'false' as const },
                        ].map((chip) => {
                            const active = providerVerified === chip.value;
                            return (
                                <TouchableOpacity
                                    key={chip.label}
                                    className={`px-3.5 py-1.5 rounded-full border ${active ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'
                                        }`}
                                    onPress={() => {
                                        setProviderVerified(chip.value);
                                        setProviderPage(1);
                                    }}
                                >
                                    <Text
                                        className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-600'
                                            }`}
                                    >
                                        {chip.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Jobs Search */}
            {activeTab === 'jobs' && (
                <View className="flex-row items-center bg-white rounded-xl px-3 h-11 border border-gray-200 gap-2">
                    <Ionicons name="search" size={18} color="#6B7280" />
                    <TextInput
                        className="flex-1 text-sm text-gray-900"
                        placeholder="Search jobs by title, company, or category..."
                        placeholderTextColor="#9CA3AF"
                        value={jobSearch}
                        onChangeText={(text) => {
                            setJobSearch(text);
                            setJobPage(1);
                        }}
                    />
                    {jobSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setJobSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Job Seekers Search */}
            {activeTab === 'jobseekers' && (
                <View className="flex-row items-center bg-white rounded-xl px-3 h-11 border border-gray-200 gap-2">
                    <Ionicons name="search" size={18} color="#6B7280" />
                    <TextInput
                        className="flex-1 text-sm text-gray-900"
                        placeholder="Search job seekers by headline, skills, or region..."
                        placeholderTextColor="#9CA3AF"
                        value={seekerSearch}
                        onChangeText={(text) => {
                            setSeekerSearch(text);
                            setSeekerPage(1);
                        }}
                    />
                    {seekerSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setSeekerSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Users Search */}
            {activeTab === 'users' && (
                <View className="flex-row items-center bg-white rounded-xl px-3 h-11 border border-gray-200 gap-2">
                    <Ionicons name="search" size={18} color="#6B7280" />
                    <TextInput
                        className="flex-1 text-sm text-gray-900"
                        placeholder="Search users by name or email..."
                        placeholderTextColor="#9CA3AF"
                        value={userSearch}
                        onChangeText={(text) => {
                            setUserSearch(text);
                            setUserPage(1);
                        }}
                    />
                    {userSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setUserSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );

    const renderPagination = () => {
        const pagination =
            activeTab === 'reports'
                ? reportsPagination
                : activeTab === 'products'
                    ? productsPagination
                    : activeTab === 'providers'
                        ? providersPagination
                        : activeTab === 'jobs'
                            ? jobsPagination
                            : activeTab === 'jobseekers'
                                ? seekersPagination
                                : usersPagination;

        if (!pagination || pagination.totalPages <= 1) return undefined;

        const currentPage = pagination.currentPage;
        const setPage =
            activeTab === 'reports'
                ? setReportPage
                : activeTab === 'products'
                    ? setProductPage
                    : activeTab === 'providers'
                        ? setProviderPage
                        : activeTab === 'jobs'
                            ? setJobPage
                            : activeTab === 'jobseekers'
                                ? setSeekerPage
                                : setUserPage;

        return (
            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <TouchableOpacity
                    className={`px-3.5 py-2 rounded-lg bg-white border border-gray-300 ${currentPage <= 1 ? 'opacity-40' : ''
                        }`}
                    disabled={currentPage <= 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                    <Text className="text-xs font-semibold text-gray-900">Previous</Text>
                </TouchableOpacity>

                <Text className="text-xs font-semibold text-gray-600">
                    Page {currentPage} of {pagination.totalPages}
                </Text>

                <TouchableOpacity
                    className={`px-3.5 py-2 rounded-lg bg-white border border-gray-300 ${currentPage >= pagination.totalPages ? 'opacity-40' : ''
                        }`}
                    disabled={currentPage >= pagination.totalPages}
                    onPress={() => setPage((p) => p + 1)}
                >
                    <Text className="text-xs font-semibold text-gray-900">Next</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const isLoading =
        activeTab === 'reports'
            ? isLoadingReports
            : activeTab === 'products'
                ? isLoadingProducts
                : activeTab === 'providers'
                    ? isLoadingProviders
                    : activeTab === 'jobs'
                        ? isLoadingJobs
                        : activeTab === 'jobseekers'
                            ? isLoadingJobSeekers
                            : isLoadingUsers;

    const listData: any[] =
        activeTab === 'reports'
            ? reports
            : activeTab === 'products'
                ? products
                : activeTab === 'providers'
                    ? providers
                    : activeTab === 'jobs'
                        ? jobs
                        : activeTab === 'jobseekers'
                            ? jobSeekers
                            : users;

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <FlatList
                data={isLoading ? [] : listData}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderPagination}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={() => {
                            handleRefresh();
                        }}
                        tintColor="#2563EB"
                    />
                }
                renderItem={({ item }) => {
                    if (activeTab === 'reports') {
                        return (
                            <AdminReportCard
                                report={item}
                                onUpdateStatus={updateReportStatus}
                                isBusy={isUpdatingStatus && updatingReportId === item._id}
                            />
                        );
                    }
                    if (activeTab === 'products') {
                        return (
                            <AdminProductCard
                                product={item}
                                onDelete={deleteProduct}
                                isDeleting={isDeletingProduct && deletingProductId === item._id}
                            />
                        );
                    }
                    if (activeTab === 'providers') {
                        return (
                            <AdminProviderCard
                                provider={item}
                                onToggleVerify={toggleVerification}
                                isToggling={isTogglingVerification && togglingProviderId === item._id}
                                onDelete={deleteProvider}
                                isDeleting={isDeletingProvider && deletingProviderId === item._id}
                            />
                        );
                    }
                    if (activeTab === 'jobs') {
                        return (
                            <AdminJobCard
                                job={item}
                                onDelete={deleteJob}
                                isDeleting={isDeletingJob && deletingJobId === item._id}
                            />
                        );
                    }
                    if (activeTab === 'jobseekers') {
                        return (
                            <AdminJobSeekerCard
                                seeker={item}
                                onDelete={deleteJobSeeker}
                                isDeleting={isDeletingJobSeeker && deletingJobSeekerId === item._id}
                            />
                        );
                    }
                    return (
                        <AdminUserCard
                            user={item}
                            onToggleVerify={toggleUserVerification}
                            isToggling={isTogglingUserVerification && togglingUserId === item._id}
                            onDelete={deleteUser}
                            isDeleting={isDeletingUser && deletingUserId === item._id}
                        />
                    );
                }}
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
                    ) : (
                        <View className="items-center py-12">
                            <Ionicons name="folder-open-outline" size={40} color="#9CA3AF" />
                            <Text className="text-base font-semibold text-gray-700 mt-2.5">
                                No {activeTab} found
                            </Text>
                            <Text className="text-xs text-gray-400 mt-1">
                                Try adjusting your filters or search query.
                            </Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}

