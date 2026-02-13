import UserApproval "user-approval/approval";
import InviteLinksModule "invite-links/invite-links-module";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";

module {
  type OldActor = {
    approvalState : UserApproval.UserApprovalState;
    inviteState : InviteLinksModule.InviteLinksSystemState;
    accessControlState : AccessControl.AccessControlState;
    stripeConfiguration : ?Stripe.StripeConfiguration;
  };

  type NewActor = {
    approvalState : UserApproval.UserApprovalState;
    inviteState : InviteLinksModule.InviteLinksSystemState;
    accessControlState : AccessControl.AccessControlState;
    stripeConfiguration : ?Stripe.StripeConfiguration;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      stripeConfiguration = null;
    };
  };
};
