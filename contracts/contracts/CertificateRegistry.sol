// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Certificate Registry
/// @notice Records certificate hashes by reference ID and allows verification of issued certificates.
contract CertificateRegistry {
    /// @notice Certificate metadata stored for a single reference.
    struct Certificate {
        bytes32 documentHash;
        address issuedBy;
        uint256 timestamp;
    }

    address public owner;
    mapping(string => Certificate) private certificates;

    event CertificateIssued(string referenceId, bytes32 documentHash, uint256 timestamp);

    /// @notice Restricts function access to the owner of the contract.
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /// @notice Sets the deploying address as the owner.
    constructor() {
        owner = msg.sender;
    }

    /// @notice Issues a new certificate for the given reference ID.
    /// @param referenceId The unique certificate reference ID.
    /// @param documentHash The hash of the certificate document.
    function issueCertificate(string memory referenceId, bytes32 documentHash) public onlyOwner {
        require(certificates[referenceId].timestamp == 0, "Certificate already exists");

        certificates[referenceId] = Certificate({
            documentHash: documentHash,
            issuedBy: msg.sender,
            timestamp: block.timestamp
        });

        emit CertificateIssued(referenceId, documentHash, block.timestamp);
    }

    /// @notice Verifies a certificate hash for a given reference ID.
    /// @param referenceId The certificate reference ID to verify.
    /// @param hashToCheck The document hash to compare against the stored value.
    /// @return isValid True if the stored hash matches the provided hash.
    /// @return issuedAt The issuance timestamp, or 0 if the certificate is not found.
    function verifyCertificate(string memory referenceId, bytes32 hashToCheck)
        public
        view
        returns (bool isValid, uint256 issuedAt)
    {
        Certificate memory certificate = certificates[referenceId];
        isValid = certificate.documentHash == hashToCheck;
        issuedAt = certificate.timestamp;
    }

    /// @notice Returns the stored certificate data for a reference ID.
    /// @param referenceId The certificate reference ID to query.
    /// @return documentHash The stored document hash.
    /// @return issuedBy The address that issued the certificate.
    /// @return timestamp The issuance timestamp, or 0 if not found.
    function getCertificate(string memory referenceId)
        public
        view
        returns (bytes32 documentHash, address issuedBy, uint256 timestamp)
    {
        Certificate memory certificate = certificates[referenceId];
        return (certificate.documentHash, certificate.issuedBy, certificate.timestamp);
    }
}
