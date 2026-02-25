using ControleFinanceiro.Application.Summary.Monthly;
using Microsoft.AspNetCore.Mvc;

namespace ControleFinanceiro.Api.Controllers;

[ApiController]
[Route("api/summary")]
public sealed class SummaryController : ControllerBase
{
    [HttpGet("monthly")]
    public async Task<IActionResult> Monthly(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromServices] GetMonthlySummaryHandler handler,
        CancellationToken ct)
    {
        try
        {
            var result = await handler.Handle(new GetMonthlySummaryQuery(year, month), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}