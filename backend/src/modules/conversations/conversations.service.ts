import {
    AlreadyConversationMemberError,
    CannotRemoveLastOwnerError,
    ConversationNotFoundError,
    DirectConversationRequiresDistinctUsersError,
    InviteAlreadyRespondedError,
    InviteExpiredError,
    InviteNotFoundError,
    NotInviteRecipientError,
    TargetNotConversationMemberError,
    UserNotFoundError,
} from "../../errors";
import { ConversationRoleName } from "../../db/schema/conversation_roles.js";
import { ConversationType } from "../../db/schema/conversations.js";
import { RealtimeGateway } from "../../realtime/realtime-gateway.js";
import { UserRepository } from "../users/users.repository.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import {
    Conversation,
    ConversationsRepository,
} from "./conversations.repository.js";
import {
    CreateConversationInput,
    CreateInviteInput,
    UpdateSettingsInput,
} from "./conversations.schemas.js";

export interface ConversationDto {
    uuid: string;
    type: ConversationType;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const toConversationDto = (c: Conversation): ConversationDto => ({
    uuid: c.uuid,
    type: c.type,
    name: c.name,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
});

export interface ConversationSettingsDto {
    disappearingMessages: boolean;
    disappearingMessagesSeconds: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export class ConversationsService {
    constructor(
        private readonly conversationsRepository: ConversationsRepository,
        private readonly userRepository: UserRepository,
        private readonly notificationsService: NotificationsService,
        private readonly realtime: RealtimeGateway,
    ) { }

    /** @throws */
    async create(
        creatorId: number,
        input: CreateConversationInput,
    ): Promise<{ conversation: ConversationDto; created: boolean }> {
        if (input.type === "direct") {
            const peer = await this.userRepository.findByUuid(input.peerUuid);
            if (!peer) throw new UserNotFoundError();
            if (peer.id === creatorId)
                throw new DirectConversationRequiresDistinctUsersError();

            const existing =
                await this.conversationsRepository.findDirectBetween(
                    creatorId,
                    peer.id,
                );
            if (existing)
                return {
                    conversation: toConversationDto(existing),
                    created: false,
                };

            const conversation =
                await this.conversationsRepository.createDirect(
                    creatorId,
                    peer.id,
                );
            this.realtime.joinConversation(creatorId, conversation.id);
            this.realtime.joinConversation(peer.id, conversation.id);
            return {
                conversation: toConversationDto(conversation),
                created: true,
            };
        }

        const conversation = await this.conversationsRepository.createGroup(
            creatorId,
            input.name,
        );
        this.realtime.joinConversation(creatorId, conversation.id);
        return { conversation: toConversationDto(conversation), created: true };
    }

    /** @throws */
    async getForMember(
        conversationId: number,
        userId: number,
    ): Promise<ConversationDto> {
        const conversation = await this.conversationsRepository.findForMember(
            conversationId,
            userId,
        );
        if (!conversation) throw new ConversationNotFoundError();
        return toConversationDto(conversation);
    }

    async listForUser(
        userId: number,
        opts: {
            limit: number;
            before?: Date | undefined;
            search?: string | undefined;
            type?: ConversationType | undefined;
            sort: "recent" | "name";
        },
    ): Promise<ConversationDto[]> {
        const rows = await this.conversationsRepository.listForUser(
            userId,
            opts,
        );
        return rows.map(toConversationDto);
    }

    /** @throws */
    async updateName(
        conversationId: number,
        conversationUuid: string,
        updatedBy: number,
        name: string,
    ): Promise<ConversationDto> {
        const conversation = await this.conversationsRepository.updateName(
            conversationId,
            updatedBy,
            name,
        );
        if (!conversation) throw new ConversationNotFoundError();

        this.realtime.emitToConversation(
            conversationId,
            "conversation:updated",
            { conversationUuid, name },
        );
        return toConversationDto(conversation);
    }

    async listMembers(conversationId: number) {
        return this.conversationsRepository.listMembers(conversationId);
    }

    /** @throws */
    async reAddMember(
        conversationId: number,
        conversationUuid: string,
        userUuid: string,
    ): Promise<void> {
        const user = await this.userRepository.findByUuid(userUuid);
        if (!user) throw new UserNotFoundError();

        const active = await this.conversationsRepository.findActiveMember(
            conversationId,
            user.id,
        );
        if (active) throw new AlreadyConversationMemberError();

        const former = await this.conversationsRepository.findFormerMember(
            conversationId,
            user.id,
        );
        if (!former) throw new TargetNotConversationMemberError();

        const memberRole = await this.conversationsRepository.findRoleByName(
            conversationId,
            "member",
        );
        if (!memberRole) throw new ConversationNotFoundError();

        await this.conversationsRepository.reactivateMember(
            conversationId,
            user.id,
            memberRole.id,
        );
        this.realtime.joinConversation(user.id, conversationId);
        this.realtime.emitToConversation(conversationId, "member:added", {
            conversationUuid,
            userUuid: user.uuid,
        });
    }

    /** @throws */
    async removeMember(
        conversationId: number,
        conversationUuid: string,
        targetUuid: string,
    ): Promise<void> {
        const target = await this.userRepository.findByUuid(targetUuid);
        if (!target) throw new UserNotFoundError();

        const targetMember =
            await this.conversationsRepository.findActiveMember(
                conversationId,
                target.id,
            );
        if (!targetMember) throw new TargetNotConversationMemberError();

        const targetRole = await this.conversationsRepository.getMemberRole(
            conversationId,
            target.id,
        );
        if (targetRole === "owner") {
            const owners =
                await this.conversationsRepository.countOwners(conversationId);
            if (owners <= 1) throw new CannotRemoveLastOwnerError();
        }

        await this.conversationsRepository.removeMember(
            conversationId,
            target.id,
        );
        this.realtime.leaveConversation(target.id, conversationId);
        this.realtime.emitToConversation(conversationId, "member:removed", {
            conversationUuid,
            userUuid: target.uuid,
        });
    }

    /** @throws */
    async leave(conversationId: number, userId: number): Promise<void> {
        const role = await this.conversationsRepository.getMemberRole(
            conversationId,
            userId,
        );
        if (role === "owner") {
            const owners =
                await this.conversationsRepository.countOwners(conversationId);
            if (owners <= 1) throw new CannotRemoveLastOwnerError();
        }

        await this.conversationsRepository.removeMember(conversationId, userId);
        this.realtime.leaveConversation(userId, conversationId);
    }

    /** @throws */
    async assignRole(
        conversationId: number,
        conversationUuid: string,
        targetUuid: string,
        role: ConversationRoleName,
    ): Promise<void> {
        const target = await this.userRepository.findByUuid(targetUuid);
        if (!target) throw new UserNotFoundError();

        const member = await this.conversationsRepository.findActiveMember(
            conversationId,
            target.id,
        );
        if (!member) throw new TargetNotConversationMemberError();

        const currentRole = await this.conversationsRepository.getMemberRole(
            conversationId,
            target.id,
        );
        if (currentRole === "owner" && role !== "owner") {
            const owners =
                await this.conversationsRepository.countOwners(conversationId);
            if (owners <= 1) throw new CannotRemoveLastOwnerError();
        }

        const roleRow = await this.conversationsRepository.findRoleByName(
            conversationId,
            role,
        );
        if (!roleRow) throw new ConversationNotFoundError();

        await this.conversationsRepository.setMemberRole(member.id, roleRow.id);
        this.realtime.emitToConversation(
            conversationId,
            "member:role-changed",
            { conversationUuid, userUuid: target.uuid, role },
        );
    }

    async getSettings(
        conversationId: number,
    ): Promise<ConversationSettingsDto | null> {
        const row =
            await this.conversationsRepository.getSettings(conversationId);
        if (!row) return null;
        return {
            disappearingMessages: row.disappearingMessages,
            disappearingMessagesSeconds: row.disappearingMessagesSeconds,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }

    async updateSettings(
        conversationId: number,
        conversationUuid: string,
        input: UpdateSettingsInput,
    ): Promise<ConversationSettingsDto> {
        const row = await this.conversationsRepository.upsertSettings(
            conversationId,
            input,
        );
        if (!row) throw new Error("conversation settings upsert returned no row");
        const settings: ConversationSettingsDto = {
            disappearingMessages: row.disappearingMessages,
            disappearingMessagesSeconds: row.disappearingMessagesSeconds,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };

        this.realtime.emitToConversation(
            conversationId,
            "conversation:settings-updated",
            { conversationUuid, settings },
        );
        return settings;
    }

    /** @throws */
    async createInvite(
        conversationId: number,
        conversationUuid: string,
        inviterId: number,
        input: CreateInviteInput,
    ) {
        const invitee = await this.userRepository.findByUuid(input.inviteeUuid);
        if (!invitee) throw new UserNotFoundError();

        const alreadyMember =
            await this.conversationsRepository.findActiveMember(
                conversationId,
                invitee.id,
            );
        if (alreadyMember) throw new AlreadyConversationMemberError();

        const expiresAt = new Date(
            Date.now() + input.expiresInHours * 60 * 60 * 1000,
        );
        const invite = await this.conversationsRepository.createInvite(
            conversationId,
            inviterId,
            invitee.id,
            expiresAt,
        );

        await this.notificationsService.notify(
            invitee.id,
            "conversation_invite",
            "New invite",
            "You've been invited to a conversation",
        );
        this.realtime.emitToUser(invitee.id, "invite:received", {
            inviteUuid: invite.uuid,
            conversationUuid,
        });

        return {
            uuid: invite.uuid,
            conversationUuid,
            inviteeUuid: invitee.uuid,
            expiresAt: invite.expiresAt,
            createdAt: invite.createdAt,
        };
    }

    async listPendingForConversation(conversationId: number) {
        return this.conversationsRepository.listPendingForConversation(
            conversationId,
        );
    }

    /** @throws */
    async revokeInvite(
        conversationId: number,
        inviteUuid: string,
    ): Promise<void> {
        const invite =
            await this.conversationsRepository.findInviteByUuid(inviteUuid);
        if (!invite || invite.conversationId !== conversationId)
            throw new InviteNotFoundError();
        if (invite.acceptedAt || invite.revokedAt)
            throw new InviteAlreadyRespondedError();

        await this.conversationsRepository.markInviteRevoked(invite.id);
    }

    async listPendingForUser(userId: number) {
        return this.conversationsRepository.listPendingForUser(userId);
    }

    /** @throws */
    async acceptInvite(
        userId: number,
        inviteUuid: string,
    ): Promise<{ conversationUuid: string }> {
        const invite =
            await this.conversationsRepository.findInviteByUuid(inviteUuid);
        if (!invite) throw new InviteNotFoundError();
        if (invite.inviteeId !== userId) throw new NotInviteRecipientError();
        if (invite.acceptedAt || invite.revokedAt)
            throw new InviteAlreadyRespondedError();
        if (invite.expiresAt <= new Date()) throw new InviteExpiredError();

        const memberRole = await this.conversationsRepository.findRoleByName(
            invite.conversationId,
            "member",
        );
        if (!memberRole) throw new ConversationNotFoundError();

        const conversation = await this.conversationsRepository.findById(
            invite.conversationId,
        );
        if (!conversation) throw new ConversationNotFoundError();

        await this.conversationsRepository.acceptInviteAndJoin(
            invite,
            memberRole.id,
        );
        this.realtime.joinConversation(userId, invite.conversationId);
        this.realtime.emitToConversation(
            invite.conversationId,
            "member:added",
            { conversationUuid: conversation.uuid },
        );

        return { conversationUuid: conversation.uuid };
    }

    /** @throws */
    async declineInvite(userId: number, inviteUuid: string): Promise<void> {
        const invite =
            await this.conversationsRepository.findInviteByUuid(inviteUuid);
        if (!invite) throw new InviteNotFoundError();
        if (invite.inviteeId !== userId) throw new NotInviteRecipientError();
        if (invite.acceptedAt || invite.revokedAt)
            throw new InviteAlreadyRespondedError();

        await this.conversationsRepository.markInviteRevoked(invite.id);
    }
}
