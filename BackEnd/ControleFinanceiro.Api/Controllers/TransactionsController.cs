using ControleFinanceiro.Application.Transactions.CreateTransaction;
using ControleFinanceiro.Application.Transactions.DeleteTransaction;
using ControleFinanceiro.Application.Transactions.GetTransactions;
using ControleFinanceiro.Application.Transactions.UpdateTransaction;
using ControleFinanceiro.Domain.Transactions;
using Microsoft.AspNetCore.Mvc;

namespace ControleFinanceiro.Api.Controllers;

[ApiController]
[Route("api/transactions")]
public sealed class TransactionsController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromServices] GetTransactionsHandler handler,
        CancellationToken ct)
    {
        var result = await handler.Handle(new GetTransactionsQuery(year, month), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateTransactionRequest req,
        [FromServices] CreateTransactionHandler handler,
        CancellationToken ct)
    {
        try
        {
            var date = new DateOnly(req.Year, req.Month, req.Day);

            var id = await handler.Handle(
                new CreateTransactionCommand(
                    req.Type,
                    req.Amount,
                    date,
                    req.CategoryId,
                    req.Description),
                ct
            );

            return Created($"/api/transactions/{id}", new { id });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateTransactionRequest req,
        [FromServices] UpdateTransactionHandler handler,
        CancellationToken ct)
    {
        try
        {
            var date = new DateOnly(req.Year, req.Month, req.Day);

            await handler.Handle(
                new UpdateTransactionCommand(
                    id,
                    req.Type,
                    req.Amount,
                    date,
                    req.CategoryId,
                    req.Description),
                ct
            );

            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromServices] DeleteTransactionHandler handler,
        CancellationToken ct)
    {
        try
        {
            await handler.Handle(new DeleteTransactionCommand(id), ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    public sealed record CreateTransactionRequest(
        TransactionType Type,
        decimal Amount,
        int Year,
        int Month,
        int Day,
        Guid? CategoryId,
        string? Description
    );

    public sealed record UpdateTransactionRequest(
        TransactionType Type,
        decimal Amount,
        int Year,
        int Month,
        int Day,
        Guid? CategoryId,
        string? Description
    );
}