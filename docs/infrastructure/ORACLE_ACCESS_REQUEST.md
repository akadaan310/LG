# Oracle access request — deployment blocked

Access has not been supplied. The reported approximately 24 GB RAM is not a verified capacity or performance measurement. These repository assets are for review; no Oracle connection, installation, firewall change, model download or deployment is authorized by their existence.

Abed should deliver credentials and sensitive network details through the team's approved secret manager or another agreed secure channel, never repository files, issue comments or ordinary chat. Public keys may be exchanged to provision access; private keys must remain with their owner.

Required handover:

- Exact Oracle tenancy/project and VM identity, environment, owner, OS/version, hostname, SSH username/port, approved public or private address, bastion/VPN route, host-key fingerprint verified independently, approved SSH public key, key provisioning/revocation process, and the minimum sudo commands allowed. Do not send a shared root password or private key in chat.
- Approved caller addresses/CIDRs, VPN arrangement, Oracle security lists/NSGs and host-firewall rules, existing exposed services/ports, TLS hostname, DNS control, certificate issuance/renewal owner, and secure certificate/private-key delivery. Raw ports 8787, 11434 and 8080 must remain loopback-only.
- Actual OCPU count, CPU architecture/features, GPU presence if any, RAM capacity and available headroom, swap, disk size/free space/type/IO headroom, network limits and egress policy. Supply current workloads, owners, peak usage, existing systemd/Caddy services and reserved resources; no changes to unrelated workloads.
- Approved runtime/version/checksum source; candidate model identity/version, quantization, license and commercial-use conditions, provenance/hash, download authorization, storage budget, context and thread budgets, and benchmark authorization. A model's presence in the registry is not approval to use it.
- Existing backups/snapshots, retention/restore owner and verified recovery procedure; maintenance window, rollback artifact, monitoring/alert destination, responder, uptime probe location and privacy-safe log retention.
- Explicit owner approval for the exact host, reviewed artifact revision, model/license selection, service-account creation, package installation, network/TLS changes, deployment, benchmark load, resource limits and maintenance/restart window. Record the approval/change ID before executing operating commands.

After handover, inspect capacity read-only, benchmark one approved CPU-compatible candidate at a time and obtain approval for the measured operating budget. The application remains manually usable while access or approval is pending. No public launch is authorized here.
