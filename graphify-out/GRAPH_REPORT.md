# Graph Report - error-detail-states  (2026-07-15)

## Corpus Check
- 119 files · ~41,393 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 866 nodes · 961 edges · 102 communities (63 shown, 39 thin omitted)
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 212 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `53d3de80`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_API Types & Interfaces|API Types & Interfaces]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Admin Categories & Products|Admin Categories & Products]]
- [[_COMMUNITY_Admin Auth & Dashboard|Admin Auth & Dashboard]]
- [[_COMMUNITY_UI Utilities & Controls|UI Utilities & Controls]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_TypeScript App Config|TypeScript App Config]]
- [[_COMMUNITY_Admin Customers & Hooks|Admin Customers & Hooks]]
- [[_COMMUNITY_Component Aliases Config|Component Aliases Config]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_TypeScript Node Config|TypeScript Node Config]]
- [[_COMMUNITY_UI Dropdown Menu|UI Dropdown Menu]]
- [[_COMMUNITY_Admin Store Settings|Admin Store Settings]]
- [[_COMMUNITY_Cart Hooks|Cart Hooks]]
- [[_COMMUNITY_Product Endpoints|Product Endpoints]]
- [[_COMMUNITY_Form Validators & Schemas|Form Validators & Schemas]]
- [[_COMMUNITY_Currency & Product Utils|Currency & Product Utils]]
- [[_COMMUNITY_UI Dialog|UI Dialog]]
- [[_COMMUNITY_UI Sheet|UI Sheet]]
- [[_COMMUNITY_Customer Detail & Utils|Customer Detail & Utils]]
- [[_COMMUNITY_Admin Orders|Admin Orders]]
- [[_COMMUNITY_Admin Stats & Charts|Admin Stats & Charts]]
- [[_COMMUNITY_Coupons Admin|Coupons Admin]]
- [[_COMMUNITY_Payments Admin|Payments Admin]]
- [[_COMMUNITY_Shipping Admin|Shipping Admin]]
- [[_COMMUNITY_API Client|API Client]]
- [[_COMMUNITY_UI Card|UI Card]]
- [[_COMMUNITY_Stats Endpoints|Stats Endpoints]]
- [[_COMMUNITY_UI Avatar|UI Avatar]]
- [[_COMMUNITY_UI Alert|UI Alert]]
- [[_COMMUNITY_UI Progress|UI Progress]]
- [[_COMMUNITY_UI Tabs|UI Tabs]]
- [[_COMMUNITY_Order Endpoints|Order Endpoints]]
- [[_COMMUNITY_Provider Badge|Provider Badge]]
- [[_COMMUNITY_UI Tooltip|UI Tooltip]]
- [[_COMMUNITY_Shared DataTable|Shared DataTable]]
- [[_COMMUNITY_Image Uploader|Image Uploader]]
- [[_COMMUNITY_Status Badge|Status Badge]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Admin System Roles|Admin System Roles]]
- [[_COMMUNITY_Claude Settings|Claude Settings]]
- [[_COMMUNITY_Confirm Dialog|Confirm Dialog]]
- [[_COMMUNITY_Empty State|Empty State]]
- [[_COMMUNITY_Error State|Error State]]
- [[_COMMUNITY_Loading Spinner|Loading Spinner]]
- [[_COMMUNITY_Markdown Renderer|Markdown Renderer]]
- [[_COMMUNITY_Page Header|Page Header]]
- [[_COMMUNITY_TypeScript Root Config|TypeScript Root Config]]
- [[_COMMUNITY_UI Badge|UI Badge]]
- [[_COMMUNITY_UI Button|UI Button]]
- [[_COMMUNITY_UI Checkbox|UI Checkbox]]
- [[_COMMUNITY_UI Label|UI Label]]
- [[_COMMUNITY_UI Separator|UI Separator]]
- [[_COMMUNITY_UI Switch|UI Switch]]
- [[_COMMUNITY_UI Textarea|UI Textarea]]
- [[_COMMUNITY_Hero Asset|Hero Asset]]
- [[_COMMUNITY_React SVG Asset|React SVG Asset]]
- [[_COMMUNITY_Vite SVG Asset|Vite SVG Asset]]
- [[_COMMUNITY_Favicon|Favicon]]
- [[_COMMUNITY_Bluesky Icon|Bluesky Icon]]
- [[_COMMUNITY_Discord Icon|Discord Icon]]
- [[_COMMUNITY_Docs Icon|Docs Icon]]
- [[_COMMUNITY_GitHub Icon|GitHub Icon]]
- [[_COMMUNITY_Social Icons|Social Icons]]
- [[_COMMUNITY_SVG Icon Set|SVG Icon Set]]
- [[_COMMUNITY_X Icon|X Icon]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 82 edges
2. `compilerOptions` - 20 edges
3. `compilerOptions` - 20 edges
4. `compilerOptions` - 16 edges
5. `compilerOptions` - 16 edges
6. `ProductFormPage()` - 11 edges
7. `useStores()` - 11 edges
8. `useCartStore` - 11 edges
9. `Mi Tienda Frontend` - 11 edges
10. `Mi Tienda Frontend` - 11 edges

## Surprising Connections (you probably didn't know these)
- `CategoryCheckboxTree()` --calls--> `cn()`  [INFERRED]
  src/pages/admin/ProductFormPage.tsx → src/lib/utils.ts
- `RequireCustomerAuth()` --calls--> `useCustomerAuthStore`  [INFERRED]
  src/app.tsx → src/stores/auth.store.ts
- `ImageUploader()` --calls--> `cn()`  [INFERRED]
  src/components/shared/ImageUploader.tsx → src/lib/utils.ts
- `LoadingSpinner()` --calls--> `cn()`  [INFERRED]
  src/components/shared/LoadingSpinner.tsx → src/lib/utils.ts
- `MarkdownRenderer()` --calls--> `cn()`  [INFERRED]
  src/components/shared/MarkdownRenderer.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Auth Flow System** — readme_admin_auth, readme_customer_auth, readme_guest_cart, readme_auth_store, readme_cart_store, readme_api_client [INFERRED 0.85]
- **Frontend Tech Stack** — readme_react_vite_spa, readme_tanstack_query, readme_zustand, readme_react_hook_form_zod, readme_shadcn_tailwind [EXTRACTED 1.00]
- **Dual App Architecture** — readme_admin_app, readme_storefront_app, readme_app_tsx [INFERRED 0.85]

## Communities (102 total, 39 thin omitted)

### Community 0 - "API Types & Interfaces"
Cohesion: 0.04
Nodes (46): AddressInput, AddressSnapshot, AuthProvider, AuthToken, BankTransferInfo, Cart, CartItem, CartStatus (+38 more)

### Community 1 - "Dev Dependencies"
Cohesion: 0.08
Nodes (25): devDependencies, @babel/core, babel-plugin-react-compiler, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+17 more)

### Community 2 - "Admin Categories & Products"
Cohesion: 0.14
Nodes (15): CategoryCheckboxTree(), ProductForm, ProductFormPage(), VariantForm, ProductsPage(), useAddVariant(), useCreateProduct(), useDeleteProduct() (+7 more)

### Community 3 - "Admin Auth & Dashboard"
Cohesion: 0.09
Nodes (19): DashboardPage(), AdminLoginPage(), LoginForm, useCurrentUser(), useLogout(), useSendMagicLink(), useVerifyMagicLink(), DashboardLayout() (+11 more)

### Community 4 - "UI Utilities & Controls"
Cohesion: 0.14
Nodes (23): cn(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), Card() (+15 more)

### Community 5 - "Package Dependencies"
Cohesion: 0.05
Nodes (40): allowScripts, fsevents@2.3.3, dependencies, @base-ui/react, class-variance-authority, clsx, @dnd-kit/core, @dnd-kit/sortable (+32 more)

### Community 6 - "TypeScript App Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx, lib, module (+14 more)

### Community 7 - "Admin Customers & Hooks"
Cohesion: 0.05
Nodes (39): allowScripts, fsevents@2.3.3, devDependencies, @babel/core, babel-plugin-react-compiler, eslint, @eslint/js, eslint-plugin-react-hooks (+31 more)

### Community 8 - "Component Aliases Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "Project Documentation"
Cohesion: 0.17
Nodes (11): Auth Flow, Build, Business Rules, Cloudflare Pages Deployment, Environment Variables, Local Development, Mi Tienda Frontend, Prerequisites (+3 more)

### Community 10 - "TypeScript Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 11 - "UI Dropdown Menu"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 12 - "Admin Store Settings"
Cohesion: 0.23
Nodes (9): NewStorePage(), StoreForm, SettingsPage(), useCreateStore(), useStore(), useStoreSettings(), useUpdateStore(), useUpdateStoreSettings() (+1 more)

### Community 13 - "Cart Hooks"
Cohesion: 0.08
Nodes (26): dependencies, @base-ui/react, class-variance-authority, clsx, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @fontsource-variable/geist (+18 more)

### Community 15 - "Form Validators & Schemas"
Cohesion: 0.15
Nodes (12): addressSchema, checkoutContactSchema, couponSchema, emailSchema, guestCheckoutSchema, loginSchema, paymentMethodSchema, productSchema (+4 more)

### Community 16 - "Currency & Product Utils"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx, lib, module (+14 more)

### Community 19 - "UI Dialog"
Cohesion: 0.18
Nodes (6): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle()

### Community 20 - "UI Sheet"
Cohesion: 0.18
Nodes (6): SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 21 - "Customer Detail & Utils"
Cohesion: 0.08
Nodes (21): CategoriesPage(), CategoryFormValues, CategoryRowProps, categorySchema, dropAnimationConfig, FormFieldsProps, categoriesKey(), useCategories() (+13 more)

### Community 23 - "Admin Stats & Charts"
Cohesion: 0.12
Nodes (15): CustomersPage(), useCreateAddress(), useCustomers(), useDeleteAddress(), useMyAddresses(), useMyOrders(), useMyProfile(), useUpdateAddress() (+7 more)

### Community 25 - "Coupons Admin"
Cohesion: 0.31
Nodes (6): CouponForm, CouponsPage(), useCoupons(), useCreateCoupon(), useDeleteCoupon(), useUpdateCoupon()

### Community 27 - "Payments Admin"
Cohesion: 0.29
Nodes (10): useAddCartItem(), useApplyCoupon(), useCart(), useRemoveCartItem(), useRemoveCoupon(), useUpdateCartItem(), CartPage(), ProductDetail() (+2 more)

### Community 28 - "Shipping Admin"
Cohesion: 0.36
Nodes (6): ShippingForm, ShippingPage(), useCreateShippingMethod(), useDeleteShippingMethod(), useShippingMethods(), useUpdateShippingMethod()

### Community 30 - "API Client"
Cohesion: 0.36
Nodes (6): apiClient, ApiError, getGuestToken(), getToken(), handleUnauthorized(), request()

### Community 31 - "UI Card"
Cohesion: 0.22
Nodes (8): Table(), TableBody(), TableCaption(), TableCell(), TableFooter(), TableHead(), TableHeader(), TableRow()

### Community 33 - "Stats Endpoints"
Cohesion: 0.48
Nodes (6): buildQuery(), getOrdersByStatus(), getRevenueOverTime(), getStatsSummary(), getTopProducts(), StatsParams

### Community 37 - "UI Alert"
Cohesion: 0.40
Nodes (5): Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants

### Community 38 - "UI Progress"
Cohesion: 0.33
Nodes (5): Progress(), ProgressIndicator(), ProgressLabel(), ProgressTrack(), ProgressValue()

### Community 39 - "UI Tabs"
Cohesion: 0.40
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 43 - "Provider Badge"
Cohesion: 0.40
Nodes (3): Provider, ProviderBadgeProps, providerConfig

### Community 46 - "Image Uploader"
Cohesion: 0.50
Nodes (3): ImageUploader(), ImageUploaderProps, UploadedImage

### Community 47 - "Status Badge"
Cohesion: 0.50
Nodes (3): StatusBadge(), StatusBadgeProps, statusConfig

### Community 50 - "Claude Settings"
Cohesion: 0.33
Nodes (4): hooks, PreToolUse, worktree, bgIsolation

### Community 64 - "UI Separator"
Cohesion: 0.20
Nodes (6): useMyOrder(), formatCurrency(), truncate(), CurrencyDisplay(), CurrencyDisplayProps, StorefrontOrderDetailPage()

### Community 66 - "UI Switch"
Cohesion: 0.17
Nodes (8): StoresPage(), useStores(), AddressForm, CheckoutPage(), ContactForm, STEPS, CheckoutSuccessPage(), ProductDetailPage()

### Community 84 - "Community 84"
Cohesion: 0.67
Nodes (3): makeCategory(), makeTree(), NONE

### Community 86 - "Community 86"
Cohesion: 0.27
Nodes (7): CHART_COLORS, StatsPage(), StatsParams, useOrdersByStatus(), useRevenueOverTime(), useStatsSummary(), useTopProducts()

### Community 87 - "Community 87"
Cohesion: 0.36
Nodes (6): PaymentForm, PaymentsPage(), useCreatePaymentMethod(), useDeletePaymentMethod(), usePaymentMethods(), useUpdatePaymentMethod()

### Community 88 - "Community 88"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 89 - "Community 89"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 91 - "Community 91"
Cohesion: 0.17
Nodes (11): Auth Flow, Build, Business Rules, Cloudflare Pages Deployment, Environment Variables, Local Development, Mi Tienda Frontend, Prerequisites (+3 more)

### Community 92 - "Community 92"
Cohesion: 0.16
Nodes (10): CustomerDetailPage(), ALL_STATUSES, OrderDetailPage(), ALL_STATUSES, OrdersPage(), useCustomer(), useOrder(), useOrders() (+2 more)

### Community 95 - "Community 95"
Cohesion: 0.25
Nodes (5): useProducts(), ProductCard(), ProductsListPage(), ProductCard(), StorefrontHomePage()

### Community 96 - "Community 96"
Cohesion: 0.40
Nodes (3): CartsTab(), useAdminCart(), useAdminCarts()

### Community 98 - "Community 98"
Cohesion: 0.50
Nodes (3): COUNTRY_CODES, SettingsForm, StoreForm

## Knowledge Gaps
- **388 isolated node(s):** `Pagination`, `JSendSuccess`, `JSendFail`, `JSendError`, `JSendResponse` (+383 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Utilities & Controls` to `Admin Categories & Products`, `UI Dropdown Menu`, `UI Dialog`, `UI Sheet`, `UI Card`, `UI Avatar`, `UI Alert`, `UI Progress`, `UI Tabs`, `UI Tooltip`, `Image Uploader`, `Status Badge`, `Loading Spinner`, `Markdown Renderer`, `UI Badge`, `UI Button`, `UI Checkbox`, `UI Label`, `UI Separator`, `UI Textarea`, `Community 90`, `Community 97`, `Community 100`, `Community 101`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `UI Separator` to `UI Switch`, `Community 86`, `Payments Admin`, `Community 92`, `Community 95`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `useStores()` connect `UI Switch` to `UI Separator`, `Admin Auth & Dashboard`, `Admin Store Settings`, `Payments Admin`, `Community 95`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 81 inferred relationships involving `cn()` (e.g. with `CategoryCheckboxTree()` and `ImageUploader()`) actually correct?**
  _`cn()` has 81 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Pagination`, `JSendSuccess`, `JSendFail` to the rest of the system?**
  _389 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Types & Interfaces` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._