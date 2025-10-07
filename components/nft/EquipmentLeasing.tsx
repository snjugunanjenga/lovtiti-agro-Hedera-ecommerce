// Equipment Leasing Interface
import React, { useState, useEffect } from 'react';
import { useEquipmentLeasing, useWallet } from '@/hooks';
import { BaseNFT, EquipmentLease } from '@/types/nft';

interface EquipmentLeasingProps {
  equipmentNFT: BaseNFT;
  onLeaseSuccess?: (lease: EquipmentLease) => void;
  onClose?: () => void;
}

export function EquipmentLeasing({ equipmentNFT, onLeaseSuccess, onClose }: EquipmentLeasingProps) {
  const { walletAccount, isConnected, connectWallet } = useWallet();
  const { leaseEquipment, isLoading, error } = useEquipmentLeasing();
  const [step, setStep] = useState<'details' | 'dates' | 'confirm'>('details');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [leaseType, setLeaseType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });
  const [pickupAddress, setPickupAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });
  const [insurance, setInsurance] = useState(true);
  const [training, setTraining] = useState(false);
  const [maintenance, setMaintenance] = useState(true);
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  const attributes = equipmentNFT.metadata.attributes;
  const isEquipment = attributes.type === 'EQUIPMENT';

  // Calculate lease duration and total cost
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      let rate = 0;
      switch (leaseType) {
        case 'daily':
          rate = attributes.leaseTerms.dailyRate;
          break;
        case 'weekly':
          rate = attributes.leaseTerms.weeklyRate;
          break;
        case 'monthly':
          rate = attributes.leaseTerms.monthlyRate;
          break;
      }

      let total = 0;
      if (leaseType === 'daily') {
        total = rate * days;
      } else if (leaseType === 'weekly') {
        total = rate * Math.ceil(days / 7);
      } else if (leaseType === 'monthly') {
        total = rate * Math.ceil(days / 30);
      }

      // Add deposit
      total += attributes.leaseTerms.deposit;

      setEstimatedTotal(total);
    }
  }, [startDate, endDate, leaseType, attributes.leaseTerms]);

  const handleLease = async () => {
    if (!walletAccount || !startDate || !endDate) return;

    try {
      const lease = await leaseEquipment(
        equipmentNFT.tokenId,
        new Date(startDate),
        new Date(endDate),
        `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state}, ${deliveryAddress.country}`,
        `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.state}, ${pickupAddress.country}`,
        insurance,
        training
      );

      if (onLeaseSuccess) {
        onLeaseSuccess(lease);
      }
    } catch (err) {
      console.error('Lease failed:', err);
    }
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Equipment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{attributes.equipmentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Model:</span>
              <span className="font-medium">{attributes.specifications.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Brand:</span>
              <span className="font-medium">{attributes.specifications.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Year:</span>
              <span className="font-medium">{attributes.specifications.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Condition:</span>
              <span className="font-medium">{attributes.condition}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Rate:</span>
              <span className="font-medium">{attributes.leaseTerms.dailyRate} HBAR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weekly Rate:</span>
              <span className="font-medium">{attributes.leaseTerms.weeklyRate} HBAR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Rate:</span>
              <span className="font-medium">{attributes.leaseTerms.monthlyRate} HBAR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Min Period:</span>
              <span className="font-medium">{attributes.leaseTerms.minimumPeriod} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deposit:</span>
              <span className="font-medium">{attributes.leaseTerms.deposit} HBAR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Features & Capabilities</h3>
        <div className="flex flex-wrap gap-2">
          {attributes.specifications.features.map((feature, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Services Included</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {attributes.leaseTerms.insurance ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600">Insurance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {attributes.leaseTerms.maintenance ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600">Maintenance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {attributes.leaseTerms.delivery ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600">Delivery</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {attributes.leaseTerms.training ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600">Training</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatesStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Lease Period</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lease Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setLeaseType('daily')}
              className={`px-4 py-2 rounded-lg border ${
                leaseType === 'daily'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setLeaseType('weekly')}
              className={`px-4 py-2 rounded-lg border ${
                leaseType === 'weekly'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setLeaseType('monthly')}
              className={`px-4 py-2 rounded-lg border ${
                leaseType === 'monthly'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {startDate && endDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-700">Lease Duration:</span>
              <span className="font-semibold text-blue-900">
                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Delivery & Pickup Addresses</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Delivery Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Street Address"
                value={deliveryAddress.street}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="City"
                value={deliveryAddress.city}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="State/Province"
                value={deliveryAddress.state}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Country"
                value={deliveryAddress.country}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, country: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={deliveryAddress.postalCode}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postalCode: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Pickup Address (Same as delivery?)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Street Address"
                value={pickupAddress.street}
                onChange={(e) => setPickupAddress({ ...pickupAddress, street: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="City"
                value={pickupAddress.city}
                onChange={(e) => setPickupAddress({ ...pickupAddress, city: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="State/Province"
                value={pickupAddress.state}
                onChange={(e) => setPickupAddress({ ...pickupAddress, state: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Country"
                value={pickupAddress.country}
                onChange={(e) => setPickupAddress({ ...pickupAddress, country: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={pickupAddress.postalCode}
                onChange={(e) => setPickupAddress({ ...pickupAddress, postalCode: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Additional Services</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={insurance}
              onChange={(e) => setInsurance(e.target.checked)}
              className="mr-3"
            />
            <span>Equipment Insurance (Included)</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={training}
              onChange={(e) => setTraining(e.target.checked)}
              className="mr-3"
            />
            <span>Operator Training (+50 HBAR)</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="mr-3"
            />
            <span>Maintenance Service (Included)</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h3 className="font-semibold text-green-900 mb-2">Lease Confirmed!</h3>
        <p className="text-green-700">
          Your equipment lease has been confirmed. The owner will be notified and equipment will be delivered to your specified address.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Lease Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Equipment:</span>
            <span className="font-medium">{attributes.specifications.model} ({attributes.equipmentType})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Lease Period:</span>
            <span className="font-medium">
              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">
              {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Lease Type:</span>
            <span className="font-medium capitalize">{leaseType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Address:</span>
            <span className="font-medium">
              {deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.state}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Cost:</span>
            <span className="font-medium">{estimatedTotal} HBAR</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">What's Next?</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3 mt-0.5">1</span>
            <span className="text-blue-700">You will receive a confirmation email with lease details</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3 mt-0.5">2</span>
            <span className="text-blue-700">Equipment owner will contact you to arrange delivery</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3 mt-0.5">3</span>
            <span className="text-blue-700">Equipment will be delivered and inspected upon arrival</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3 mt-0.5">4</span>
            <span className="text-blue-700">You can track equipment status and schedule pickup</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isEquipment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invalid NFT Type</h2>
          <p className="text-gray-600 mb-6">This NFT is not an equipment NFT and cannot be leased.</p>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Lease Equipment</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step === 'dates' || step === 'confirm' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'dates' ? 'bg-blue-600 text-white' : step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${step === 'confirm' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Step Content */}
        {step === 'details' && renderDetailsStep()}
        {step === 'dates' && renderDatesStep()}
        {step === 'confirm' && renderConfirmStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          {step === 'details' && (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('dates')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue
              </button>
            </>
          )}

          {step === 'dates' && (
            <>
              <button
                onClick={() => setStep('details')}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!startDate || !endDate}
              >
                Review & Confirm
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('dates')}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleLease}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={!isConnected || isLoading}
              >
                {!isConnected ? 'Connect Wallet' : isLoading ? 'Processing...' : 'Confirm Lease'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
