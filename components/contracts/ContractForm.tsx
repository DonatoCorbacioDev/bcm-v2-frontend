"use client";

interface ContractFormProps {
  readonly onClose: () => void;
}

export default function ContractForm({ onClose }: Readonly<ContractFormProps>) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Create New Contract</h3>
      <p className="text-gray-500 mb-4">Form coming soon...</p>

      {/* Bottone per chiudere il dialog */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          disabled
          className="px-4 py-2 text-white bg-blue-600 rounded-lg opacity-50 cursor-not-allowed"
        >
          Create Contract (Coming Soon)
        </button>
      </div>
    </div>
  );
}
