import React, { useMemo, useState } from 'react';
import { Input, Button, Modal, Form, Select, App, Descriptions, Tooltip, AutoComplete } from 'antd';
import { SearchOutlined, EyeOutlined, BankOutlined, UserOutlined, LoadingOutlined, CloseCircleOutlined, EditOutlined } from '@ant-design/icons';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import UserCell from '../../components/ui/UserCell';
import StatCard from '../../components/ui/StatCard';
import { COLORS } from '../../constants/theme';
import { organizationName } from '../../auth/session';
import { STATES } from '../../data/roles';
import { useCollection, useLogChange, newId } from '../../store/AdminStore';
import { formatDate, matchesQuery } from '../../utils/format';

const BRANCH_STATUSES = ['Active', 'Pending', 'Suspended'];
const CLASSES = ['T20', 'A1', 'B2', 'J6', 'J8'];
const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

/** Add / edit branch form (modal). */
const BranchModal = ({ open, branch, onClose, onSave, existingNames, organizations, saving }) => {
    const [form] = Form.useForm();
    return (
        <Modal
            open={open}
            title={branch ? `Edit ${branch.name}` : 'Add Branch'}
            onCancel={onClose}
            onOk={() => form.submit()}
            okText={branch ? 'Save Changes' : 'Add Branch'}
            okButtonProps={{ loading: saving }}
            destroyOnHidden
            afterOpenChange={(o) => o && form.setFieldsValue(branch ?? { status: 'Pending', organization: organizations[0] })}
        >
            <Form form={form} layout="vertical" onFinish={onSave}>
                <Form.Item
                    name="name"
                    label="Branch Name"
                    rules={[
                        { required: true, message: 'Enter branch name' },
                        { validator: (_, v) => (v && existingNames.includes(v.trim().toLowerCase()) ? Promise.reject(new Error('A branch with this name already exists')) : Promise.resolve()) },
                    ]}
                >
                    <Input placeholder="e.g. Surat Branch" maxLength={60} />
                </Form.Item>
                <div className="grid grid-cols-2 gap-x-3">
                    <Form.Item name="organization" label="Organization" rules={[{ required: true, message: 'Select organization' }]}>
                        <AutoComplete options={toOptions(organizations)} placeholder="Select or type organization" filterOption={(input, o) => o.value.toLowerCase().includes(input.toLowerCase())} />
                    </Form.Item>
                    <Form.Item name="class" label="Class" rules={[{ required: true, message: 'Select class' }]}>
                        <Select placeholder="Select Class" options={toOptions(CLASSES)} />
                    </Form.Item>
                    <Form.Item name="city" label="City" rules={[{ required: true, message: 'Enter city' }]}>
                        <Input placeholder="e.g. Surat" />
                    </Form.Item>
                    <Form.Item name="state" label="State" rules={[{ required: true, message: 'Select state' }]}>
                        <Select placeholder="Select State" options={toOptions(STATES)} showSearch />
                    </Form.Item>
                    <Form.Item name="contact" label="Contact Number" rules={[{ required: true, message: 'Enter contact number' }, { pattern: /^(\+91[\s-]?)?[6-9]\d{9}$/, message: 'Enter a valid mobile number' }]}>
                        <Input placeholder="+91 9876543210" />
                    </Form.Item>
                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select options={toOptions(BRANCH_STATUSES)} />
                    </Form.Item>
                </div>
                <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Enter address' }]}>
                    <Input.TextArea rows={2} placeholder="Street, area" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

/**
 * Branches/Offices -- search, status cards (click to filter), add/edit
 * branch, view details with quick status change. Branches feed the
 * Create Users "Assigned Branch" list and template "Used By" counts.
 */
const BranchesPage = () => {
    const { message } = App.useApp();
    const { items: branches, add, update } = useCollection('branches');
    const { items: users } = useCollection('users');
    const { items: templates } = useCollection('documentTemplates');
    const logChange = useLogChange();

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);
    const [formState, setFormState] = useState(null); // { branch } | { branch: null } for add
    const [viewing, setViewing] = useState(null);

    const counts = useMemo(() => ({
        orgs: new Set(branches.map((b) => b.organization)).size,
        ...Object.fromEntries(BRANCH_STATUSES.map((s) => [s, branches.filter((b) => b.status === s).length])),
    }), [branches]);

    const rows = branches.filter((b) => matchesQuery(b, query, ['name', 'organization', 'city']) && (!statusFilter || b.status === statusFilter));
    const viewBranch = viewing && branches.find((b) => b.id === viewing);

    const [saving, setSaving] = useState(false);
    // The portal's insurer first, then every organization already used by a branch.
    const organizations = useMemo(() => [...new Set([organizationName(), ...branches.map((b) => b.organization)].filter(Boolean))], [branches]);

    const save = async (values) => {
        const clean = { ...values, name: values.name.trim(), organization: values.organization.trim() };
        const editing = formState?.branch;
        setSaving(true);
        const saved = editing ? await update(editing.id, clean) : await add({ ...clean, id: newId('BR'), createdAt: new Date().toISOString() });
        setSaving(false);
        if (!saved) return;
        if (editing) {
            if (editing.status !== clean.status) logChange('Branches/Offices', `${clean.name} status`, editing.status, clean.status);
            else logChange('Branches/Offices', `${clean.name} details`, '—', 'Updated');
            message.success('Branch updated');
        } else {
            logChange('Branches/Offices', 'Branch Added', '—', `${clean.name} (${clean.organization})`);
            message.success(`${clean.name} added`);
        }
        setFormState(null);
    };

    const changeStatus = async (b, status) => {
        if (!(await update(b.id, { status }))) return;
        logChange('Branches/Offices', `${b.name} status`, b.status, status);
        message.success(`${b.name} → ${status}`);
    };

    const toggleFilter = (s) => setStatusFilter((cur) => (cur === s ? null : s));

    const columns = [
        { title: 'Branch', render: (_, b) => <UserCell name={b.name} />, width: 210 },
        { title: 'Organization', dataIndex: 'organization' },
        { title: 'City', dataIndex: 'city' },
        { title: 'Staus', render: (_, b) => <StatusTag status={b.status} minWidth={110} />, align: 'center' },
        { title: 'Class', dataIndex: 'class', align: 'center' },
        {
            title: 'Actions',
            align: 'center',
            render: (_, b) => (
                <div className="flex justify-center gap-1">
                    <Tooltip title="View"><Button type="text" icon={<EyeOutlined style={{ fontSize: 14 }} />} onClick={() => setViewing(b.id)} /></Tooltip>
                    <Tooltip title="Edit"><Button type="text" icon={<EditOutlined style={{ fontSize: 13 }} />} onClick={() => setFormState({ branch: b })} /></Tooltip>
                </div>
            ),
        },
    ];

    const existingNames = branches.filter((b) => b.id !== formState?.branch?.id).map((b) => b.name.toLowerCase());

    return (
        <>
            <h1 className="text-[20px] font-bold m-0 mb-3" style={{ color: COLORS.primary }}>Branches/Offices</h1>

            <div className="filter-bar flex flex-wrap items-center justify-between gap-2 mb-2">
                <Input allowClear value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Branch By Name" suffix={<SearchOutlined />} style={{ width: 'min(100%, 380px)' }} />
                <Button type="primary" style={{ minWidth: 130 }} onClick={() => setFormState({ branch: null })}>+ Add Branch</Button>
            </div>

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-4 mb-2">
                <StatCard label="Total Organizations" value={counts.orgs} icon={<BankOutlined />} tone="blue" onClick={() => setStatusFilter(null)} active={!statusFilter} />
                <StatCard label="Active" value={counts.Active} icon={<UserOutlined />} tone="green" onClick={() => toggleFilter('Active')} active={statusFilter === 'Active'} />
                <StatCard label="Pending" value={counts.Pending} icon={<LoadingOutlined />} tone="orange" onClick={() => toggleFilter('Pending')} active={statusFilter === 'Pending'} />
                <StatCard label="Suspended" value={counts.Suspended} icon={<CloseCircleOutlined />} tone="red" onClick={() => toggleFilter('Suspended')} active={statusFilter === 'Suspended'} />
            </div>

            <DataTable columns={columns} dataSource={rows} pageSize={8} scrollX={900} locale={{ emptyText: 'No branches found' }} />

            <BranchModal open={!!formState} branch={formState?.branch} onClose={() => setFormState(null)} onSave={save} existingNames={existingNames} organizations={organizations} saving={saving} />

            <Modal
                open={!!viewBranch}
                title={viewBranch?.name}
                onCancel={() => setViewing(null)}
                width={620}
                footer={viewBranch && (
                    <div className="flex flex-wrap justify-end gap-2">
                        {BRANCH_STATUSES.filter((s) => s !== viewBranch.status).map((s) => (
                            <Button key={s} danger={s === 'Suspended'} onClick={() => changeStatus(viewBranch, s)}>{s === 'Active' ? 'Activate' : s === 'Pending' ? 'Mark Pending' : 'Suspend'}</Button>
                        ))}
                        <Button type="primary" onClick={() => { setViewing(null); setFormState({ branch: viewBranch }); }}>Edit</Button>
                    </div>
                )}
            >
                {viewBranch && (
                    <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label="Organization" span={2}>{viewBranch.organization}</Descriptions.Item>
                        <Descriptions.Item label="City">{viewBranch.city}</Descriptions.Item>
                        <Descriptions.Item label="State">{viewBranch.state}</Descriptions.Item>
                        <Descriptions.Item label="Status"><StatusTag status={viewBranch.status} /></Descriptions.Item>
                        <Descriptions.Item label="Class">{viewBranch.class}</Descriptions.Item>
                        <Descriptions.Item label="Contact">{viewBranch.contact}</Descriptions.Item>
                        <Descriptions.Item label="Created">{formatDate(viewBranch.createdAt)}</Descriptions.Item>
                        <Descriptions.Item label="Address" span={2}>{viewBranch.address}</Descriptions.Item>
                        <Descriptions.Item label="Handlers assigned">{users.filter((u) => u.extra?.branchId === viewBranch.id).length}</Descriptions.Item>
                        <Descriptions.Item label="Templates used">{templates.filter((t) => t.branchIds.includes(viewBranch.id)).length}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </>
    );
};

export default BranchesPage;
